import React, { useRef, useEffect } from 'react';
import { useTheme } from '../../utils/themeInitializer';
import { hexToRgb, cssColorToRgb } from './ColorUtils';

const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform vec3 u_accentColor;
  uniform float u_complexity;
  uniform float u_speed;
  uniform float u_brightness;
  uniform float u_saturation;
  varying vec2 v_texCoord;

  float noise(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  float smoothNoise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = noise(i);
    float b = noise(i + vec2(1.0, 0.0));
    float c = noise(i + vec2(0.0, 1.0));
    float d = noise(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec2 st = v_texCoord;
    
    // Animate the light source position around a corner (e.g., bottom-right)
    float time = u_time * u_speed;
    vec2 light_pos = vec2(1.0 + 0.2 * sin(time), 0.0 - 0.2 * cos(time));
    
    // Calculate distance to the light source
    float dist = distance(st, light_pos);
    
    // Create a radial glow
    float glow = 1.0 / (1.0 + pow(dist * u_complexity, 2.0));
    
    // Base color is now the primary color (Blue)
    vec3 color = u_primaryColor;
    
    // Mix in the secondary (Orange) and accent (Purple) for the glow
    vec3 glow_color = mix(u_secondaryColor, u_accentColor, 0.2);
    color = mix(color, glow_color, glow * 0.8);
    
    // Adjust saturation
    vec3 gray = vec3(dot(color, vec3(0.299, 0.587, 0.114)));
    color = mix(gray, color, u_saturation);

    // Apply master brightness
    color *= u_brightness;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

interface WebGLCanvasProps {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  className?: string;
}

const WebGLCanvas: React.FC<WebGLCanvasProps> = ({ colors, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const animationFrameIdRef = useRef<number>();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    glRef.current = canvas.getContext('webgl');
    const gl = glRef.current;
    
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Error compiling shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Error linking program:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    const texCoords = [
      0, 0,
      1, 0,
      0, 1,
      0, 1,
      1, 0,
      1, 1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

    const texCoordAttributeLocation = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(texCoordAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeUniformLocation = gl.getUniformLocation(program, 'u_time');
    const primaryColorUniformLocation = gl.getUniformLocation(program, 'u_primaryColor');
    const secondaryColorUniformLocation = gl.getUniformLocation(program, 'u_secondaryColor');
    const accentColorUniformLocation = gl.getUniformLocation(program, 'u_accentColor');
    const complexityUniformLocation = gl.getUniformLocation(program, 'u_complexity');
    const speedUniformLocation = gl.getUniformLocation(program, 'u_speed');
    const brightnessUniformLocation = gl.getUniformLocation(program, 'u_brightness');
    const saturationUniformLocation = gl.getUniformLocation(program, 'u_saturation');

    // Helper to resolve CSS variables to a parseable rgb() string
    const getThemeColor = (varName: string): string => {
      const tempEl = document.createElement('div');
      tempEl.style.color = `hsl(var(${varName}))`;
      tempEl.style.display = 'none';
      document.body.appendChild(tempEl);
      const color = getComputedStyle(tempEl).color;
      document.body.removeChild(tempEl);
      return color;
    };
    
    const themeBgColor = getThemeColor('--background');

    // The base color is now the theme's background, with Orange/Purple for the glow
    const primaryRgb = hexToRgb('#181926'); // Charcoal with blue/purple undertone
    const secondaryRgb = hexToRgb(colors.primary); // Orange from props
    const accentRgb = hexToRgb(colors.accent); // Purple from props

    const startTime = Date.now();
    
    const render = () => {
      const gl = glRef.current;
      if (!gl) return;

      const currentTime = (Date.now() - startTime) / 1000;
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
      gl.uniform1f(timeUniformLocation, currentTime);
      gl.uniform3fv(primaryColorUniformLocation, primaryRgb);
      gl.uniform3fv(secondaryColorUniformLocation, secondaryRgb);
      gl.uniform3fv(accentColorUniformLocation, accentRgb);
      
      // Theme-aware and refined animation parameters for "Corner Glow"
      if (resolvedTheme === 'dark') {
        gl.uniform1f(complexityUniformLocation, 4.5); // Tighter glow
        gl.uniform1f(speedUniformLocation, 0.2);     // Slow drift
        gl.uniform1f(brightnessUniformLocation, 0.85); // Brighter glow
        gl.uniform1f(saturationUniformLocation, 1.2); // A bit more vibrant
      } else {
        gl.uniform1f(complexityUniformLocation, 3.5);
        gl.uniform1f(speedUniformLocation, 0.25);
        gl.uniform1f(brightnessUniformLocation, 1.1); // Brighter glow
        gl.uniform1f(saturationUniformLocation, 1.2);
      }

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    const resizeObserver = new ResizeObserver(entries => {
        const entry = entries[0];
        const { width, height } = entry.contentRect;
        canvas.width = width;
        canvas.height = height;
    });

    if (canvas.parentElement) {
        resizeObserver.observe(canvas.parentElement);
    }

    render();

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (canvas.parentElement) {
        resizeObserver.unobserve(canvas.parentElement);
      }
    };
  }, [colors, resolvedTheme]);

  return <canvas ref={canvasRef} className={className} />;
};

export default WebGLCanvas;
