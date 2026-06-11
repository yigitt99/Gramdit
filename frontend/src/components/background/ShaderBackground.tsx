import { useEffect, useRef } from 'react';

const ShaderBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { antialias: true, alpha: false });
    if (!gl) {
      console.warn('WebGL not supported, using fallback background');
      return;
    }

    // Set canvas size
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Vertex Shader - Optimized for premium rendering
    const vertexShader = `
      precision highp float;
      
      attribute vec2 position;
      
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Fragment Shader - Apple/Nike Premium Quality (Deep Black + Elegant Light Beam)
    const fragmentShader = `
      precision highp float;
      
      uniform vec2 resolution;
      uniform float time;
      
      void main() {
        // Koordinatları merkeze göre eşitle (-1 ile 1 arasında)
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        
        // Premium eğrisel ışık kuşağı (yarığı) - 1. Görseldeki asil tasarım
        // Yumuşak sinüs dalgası kombinasyonu ile eğri ışık yaratmak
        float wave = uv.y + sin(uv.x * 0.8 + time * 0.2) * 0.3 - cos(uv.x * 0.4) * 0.2;
        
        // Işığın kalınlığı ve merkezdeki keskin parlaması (çok ince ve yoğun)
        float glow = 0.02 / abs(wave);
        
        // Renk Katmanları (Apple/Nike kalitesi)
        // 1. Merkez: Parlak beyaz-krem (en yoğun)
        vec3 centerWhite = vec3(1.0, 0.95, 0.85) * pow(glow, 1.5);
        
        // 2. Kenarlar: Gramdit turuncu (#ff7a00)
        vec3 edgeOrange = vec3(1.0, 0.48, 0.0) * glow;
        
        // 3. Dış kenarlar: Hafif mavi/safir parıltısı (premium feel)
        vec3 outerBlue = vec3(0.3, 0.5, 1.0) * (glow * 0.3);
        
        // Arka planı derin siyah (#0a0a0a) olarak başlat
        vec3 finalColor = vec3(0.04, 0.04, 0.04);
        
        // Işık katmanlarını ekle
        finalColor += centerWhite + edgeOrange + outerBlue;
        
        // Kenarlara doğru hafif kararma (Vignette) - derinlik ve sofistike his
        float vignette = 1.0 - length(uv * 0.3);
        finalColor *= vignette;
        
        // Çıktı: tam opaklıkta derin siyah arka plan + parlayan ışık
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    // Compile shaders
    const compileShader = (source: string, type: number) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error('Failed to create shader');
      
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        throw new Error('Shader compilation failed');
      }
      
      return shader;
    };

    let program;
    try {
      const vShader = compileShader(vertexShader, gl.VERTEX_SHADER);
      const fShader = compileShader(fragmentShader, gl.FRAGMENT_SHADER);

      program = gl.createProgram();
      if (!program) throw new Error('Failed to create program');

      gl.attachShader(program, vShader);
      gl.attachShader(program, fShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        throw new Error('Program linking failed');
      }

      gl.deleteShader(vShader);
      gl.deleteShader(fShader);
    } catch (error) {
      console.warn('Shader compilation failed, using fallback:', error);
      return;
    }

    // Setup geometry
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = [-1, -1, 1, -1, -1, 1, 1, 1];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    const resolutionLocation = gl.getUniformLocation(program, 'resolution');
    const timeLocation = gl.getUniformLocation(program, 'time');

    // Render loop - optimized for premium smooth animation
    const startTime = Date.now();
    const render = () => {
      // Use slower time scale for elegant animation
      const elapsed = (Date.now() - startTime) / 2000; // 2x slower for sophisticated feel

      gl.useProgram(program);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, elapsed);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationIdRef.current = requestAnimationFrame(render);
    };

    animationIdRef.current = requestAnimationFrame(render);

    // Cleanup
    return () => {
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
      gl.deleteProgram(program);
      gl.deleteBuffer(positionBuffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{
        display: 'block',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -10,
        pointerEvents: 'none',
        opacity: 0.85,
      }}
    />
  );
};

export default ShaderBackground;
