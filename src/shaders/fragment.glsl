precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec3 u_primaryColor;   // #f97316 -> RGB
uniform vec3 u_secondaryColor; // #0ea5e9 -> RGB
uniform vec3 u_accentColor;    // #8b5cf6 -> RGB
uniform float u_complexity;
uniform float u_speed;

varying vec2 v_texCoord;

// Noise function for organic movement
float noise(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// Smooth noise for fluid gradients
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
  vec2 st = gl_FragCoord.xy / u_resolution.xy;
  
  // Create flowing movement
  float time = u_time * u_speed;
  vec2 flow = vec2(
    smoothNoise(st * u_complexity + time * 0.1),
    smoothNoise(st * u_complexity + time * 0.15 + 100.0)
  );
  
  // Generate gradient zones
  float zone1 = smoothNoise(st + flow * 0.5 + time * 0.05);
  float zone2 = smoothNoise(st * 2.0 - flow * 0.3 + time * 0.08);
  float zone3 = smoothNoise(st * 0.5 + flow * 0.8 + time * 0.03);
  
  // Blend TradeYa brand colors
  vec3 color = mix(u_primaryColor, u_secondaryColor, zone1);
  color = mix(color, u_accentColor, zone2 * 0.6);
  color = mix(color, u_primaryColor * 0.8, zone3 * 0.4);
  
  // Add subtle luminosity variation
  float luminosity = 0.8 + 0.2 * sin(time + zone1 * 10.0);
  color *= luminosity;
  
  gl_FragColor = vec4(color, 1.0);
}
