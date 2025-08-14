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
  uniform float u_overlay; // 1.0 = overlay (transparent), 0.0 = background (opaque)
  uniform float u_preset;  // 0=ribbons, 1=aurora, 2=metaballs, 3=audio
  uniform float u_intensity; // 0.0 - 1.0 multiplier for overlay alpha
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
    float time = u_time * u_speed;

    if (u_overlay > 0.5) {
      // Overlay branch with selectable presets
      vec2 uv = st;
      uv.x *= u_resolution.x / max(u_resolution.y, 1.0);

      if (u_preset < 0.5) {
        // 0: ribbons
        float band1 = 0.5 + 0.5 * sin((uv.x * 6.283 * 1.2) + time * 0.8);
        float band2 = 0.5 + 0.5 * sin((uv.y * 6.283 * 0.8) - time * 0.6);
        float bands = clamp(0.6 * band1 + 0.4 * band2, 0.0, 1.0);
        vec2 center = vec2(0.5 + 0.1 * sin(time * 0.3), 0.5 + 0.05 * cos(time * 0.4));
        float r = distance(st, center);
        float radial = smoothstep(0.8, 0.0, r);
        float intensity = clamp(0.2 + 0.6 * bands * radial, 0.0, 1.0);
        vec3 color = mix(u_secondaryColor, u_accentColor, bands);
        vec3 gray = vec3(dot(color, vec3(0.299, 0.587, 0.114)));
        color = mix(gray, color, u_saturation);
        color *= u_brightness;
        float alpha = (0.15 + 0.35 * intensity) * u_intensity;
        gl_FragColor = vec4(color, alpha);
        return;
      } else if (u_preset < 1.5) {
        // 1: aurora (curl-like smooth ribbons)
        vec2 p = (st - 0.5) * vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
        float a = 0.0;
        for (int i = 0; i < 3; i++) {
          p += 0.05 * vec2(sin(3.0*p.y + time*0.6), cos(3.0*p.x - time*0.5));
          a += 0.5 / (0.2 + dot(p, p));
        }
        float t = clamp(a * 0.6, 0.0, 1.0);
        vec3 color = mix(u_secondaryColor, u_accentColor, t);
        vec3 gray = vec3(dot(color, vec3(0.299, 0.587, 0.114)));
        color = mix(gray, color, u_saturation) * u_brightness;
        float alpha = (0.18 + 0.32 * t) * u_intensity;
        gl_FragColor = vec4(color, alpha);
        return;
      } else if (u_preset < 2.5) {
        // 2: metaballs (distance-based blend)
        vec2 p = st;
        vec2 c1 = vec2(0.4 + 0.1*sin(time*0.8), 0.5 + 0.1*cos(time*0.6));
        vec2 c2 = vec2(0.6 + 0.1*cos(time*0.7), 0.5 + 0.08*sin(time*0.9));
        float b1 = 0.12 / (distance(p, c1) + 0.001);
        float b2 = 0.12 / (distance(p, c2) + 0.001);
        float f = clamp(b1 + b2, 0.0, 1.0);
        vec3 color = mix(u_secondaryColor, u_accentColor, smoothstep(0.2, 0.8, f));
        vec3 gray = vec3(dot(color, vec3(0.299, 0.587, 0.114)));
        color = mix(gray, color, u_saturation) * u_brightness;
        float alpha = (smoothstep(0.1, 0.6, f) * 0.5 + 0.15) * u_intensity;
        gl_FragColor = vec4(color, alpha);
        return;
      } else {
        // 3: audio (placeholder wave interference)
        float w1 = 0.5 + 0.5*sin(uv.x*10.0 + time*1.2);
        float w2 = 0.5 + 0.5*sin(uv.y*8.0 - time*0.9);
        float t = clamp(0.5*w1 + 0.5*w2, 0.0, 1.0);
        vec3 color = mix(u_secondaryColor, u_accentColor, t);
        vec3 gray = vec3(dot(color, vec3(0.299, 0.587, 0.114)));
        color = mix(gray, color, u_saturation) * u_brightness;
        float alpha = (0.15 + 0.35 * t) * u_intensity;
        gl_FragColor = vec4(color, alpha);
        return;
      }
    }

    // Background branch (opaque, subtle corner glow)
    vec2 light_pos = vec2(1.0 + 0.2 * sin(time), 0.0 - 0.2 * cos(time));
    float dist = distance(st, light_pos);
    float glow = 1.0 / (1.0 + pow(dist * u_complexity, 2.0));
    vec3 base_color = u_primaryColor;
    vec3 glow_color = mix(u_secondaryColor, u_accentColor, 0.25);
    vec3 color = mix(base_color, glow_color, glow * 0.8);
    vec3 gray = vec3(dot(color, vec3(0.299, 0.587, 0.114)));
    color = mix(gray, color, u_saturation);
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
  transparent?: boolean;
  speed?: number;
  complexity?: number;
  brightness?: number;
  saturation?: number;
  preset?: 'ribbons' | 'aurora' | 'metaballs' | 'audio';
  intensity?: number; // 0..1 overlay alpha multiplier
}

const WebGLCanvas: React.FC<WebGLCanvasProps> = ({ colors, className, transparent, speed, complexity, brightness, saturation, preset = 'ribbons', intensity }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const animationFrameIdRef = useRef<number>();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (
      canvas.getContext('webgl', {
        alpha: true,
        premultipliedAlpha: true,
        antialias: true,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
      } as WebGLContextAttributes) ||
      (canvas.getContext('experimental-webgl', {
        alpha: true,
        premultipliedAlpha: true,
        antialias: true,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
      } as any) as WebGLRenderingContext | null)
    ) as WebGLRenderingContext | null;
    glRef.current = gl;
    
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
    const overlayUniformLocation = gl.getUniformLocation(program, 'u_overlay');
    const presetUniformLocation = gl.getUniformLocation(program, 'u_preset');
    const intensityUniformLocation = gl.getUniformLocation(program, 'u_intensity');

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
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
      gl.uniform1f(timeUniformLocation, currentTime);
      gl.uniform3fv(primaryColorUniformLocation, primaryRgb);
      gl.uniform3fv(secondaryColorUniformLocation, secondaryRgb);
      gl.uniform3fv(accentColorUniformLocation, accentRgb);
      gl.uniform1f(overlayUniformLocation, transparent ? 1.0 : 0.0);
      const normalized = typeof intensity === 'number' ? Math.max(0, Math.min(1, intensity)) : 1.0;
      gl.uniform1f(intensityUniformLocation, transparent ? normalized : 1.0);
      // map preset string to numeric index for shader
      let presetIndex = 0.0; // ribbons
      // preset prop is not typed here; map if available
      try {
        const anyPreset = (preset as any) || 'ribbons';
        if (anyPreset === 'aurora') presetIndex = 1.0;
        else if (anyPreset === 'metaballs') presetIndex = 2.0;
        else if (anyPreset === 'audio') presetIndex = 3.0;
      } catch {}
      gl.uniform1f(presetUniformLocation, presetIndex);
      
      // Theme-aware and refined animation parameters for "Corner Glow"
      // Keep original background defaults; use faster defaults only for overlay unless explicitly overridden
      const defaultComplexity = resolvedTheme === 'dark' ? 4.5 : 3.5;
      const defaultBgSpeed = resolvedTheme === 'dark' ? 0.2 : 0.25;
      const defaultBgBrightness = resolvedTheme === 'dark' ? 0.85 : 1.1;
      const defaultSaturation = 1.2;

      const c = typeof complexity === 'number' ? complexity : defaultComplexity;
      const s = typeof speed === 'number' ? speed : (transparent ? 0.6 : defaultBgSpeed);
      const b = typeof brightness === 'number' ? brightness : (transparent ? 1.2 : defaultBgBrightness);
      const sat = typeof saturation === 'number' ? saturation : defaultSaturation;
      gl.uniform1f(complexityUniformLocation, c);
      gl.uniform1f(speedUniformLocation, s);
      gl.uniform1f(brightnessUniformLocation, b);
      gl.uniform1f(saturationUniformLocation, sat);

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
  }, [colors, resolvedTheme, transparent, speed, complexity, brightness, saturation, preset, intensity]);

  return <canvas ref={canvasRef} className={className} style={{ display: 'block', width: '100%', height: '100%' }} />;
};

export default WebGLCanvas;
