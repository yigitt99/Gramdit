'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface SceneRefs {
  scene: THREE.Scene | null;
  camera: THREE.OrthographicCamera | null;
  renderer: THREE.WebGLRenderer | null;
  mesh: THREE.Mesh | null;
  uniforms: Record<string, { value: number | number[] }> | null;
  animationId: number | null;
}

export function WebGLShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneRefs>({
    scene: null,
    camera: null,
    renderer: null,
    mesh: null,
    uniforms: null,
    animationId: null,
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const { current: refs } = sceneRef;

    // Gramdit Premium Shader - Modified for elegant light beam
    const vertexShader = `
      attribute vec3 position;
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      
      uniform vec2 resolution;
      uniform float time;
      uniform float xScale;
      uniform float yScale;
      uniform float distortion;
      
      void main() {
        // Normalize coordinates
        vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
        
        // Chromatic aberration coordinates
        float d = length(p) * distortion;
        float rx = p.x + d * 0.1;
        float gx = p.x;
        float bx = p.x - d * 0.1;
        
        // Dynamic U-shaped cosmic arc equations for Red, Green, and Blue
        float waveR = sin((rx + time * 0.2) * 1.1) * 0.06;
        float waveG = sin((gx + time * 0.2) * 1.1) * 0.06;
        float waveB = sin((bx + time * 0.2) * 1.1) * 0.06;
        
        float curveR = p.y - (rx * rx * 0.45) + 0.3 - waveR;
        float curveG = p.y - (gx * gx * 0.45) + 0.3 - waveG;
        float curveB = p.y - (bx * bx * 0.45) + 0.3 - waveB;
        
        // Bright glowing cores with high falloff
        float r = 0.04 / abs(curveR);
        float g = 0.04 / abs(curveG);
        float b = 0.04 / abs(curveB);
        
        vec3 color = vec3(r, g, b);
        
        // Add vignette for depth
        float vignette = 1.0 - length(p * 0.25);
        color *= vignette;
        
        // Boost light peaks for premium HDR look
        color = pow(color, vec3(1.1));
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const initScene = () => {
      refs.scene = new THREE.Scene();
      refs.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
      refs.renderer.setPixelRatio(window.devicePixelRatio);
      refs.renderer.setClearColor(new THREE.Color(0x0a0a0a)); // Gramdit deep black
      refs.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, -1);

      refs.uniforms = {
        resolution: { value: [window.innerWidth, window.innerHeight] },
        time: { value: 0.0 },
        xScale: { value: 1.0 },
        yScale: { value: 0.5 },
        distortion: { value: 0.05 },
      };

      const position = [
        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0,
        -1.0, 1.0, 0.0,
        1.0, -1.0, 0.0,
        -1.0, 1.0, 0.0,
        1.0, 1.0, 0.0,
      ];

      const positions = new THREE.BufferAttribute(new Float32Array(position), 3);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', positions);

      const material = new THREE.RawShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: refs.uniforms,
        side: THREE.DoubleSide,
      });

      refs.mesh = new THREE.Mesh(geometry, material);
      refs.scene.add(refs.mesh);

      handleResize();
    };

    const animate = () => {
      if (refs.uniforms && typeof refs.uniforms.time.value === 'number') {
        refs.uniforms.time.value += 0.01;
      }
      if (refs.renderer && refs.scene && refs.camera) {
        refs.renderer.render(refs.scene, refs.camera);
      }
      refs.animationId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      if (!refs.renderer || !refs.uniforms) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      refs.renderer.setSize(width, height, false);
      refs.uniforms.resolution.value = [width, height];
    };

    initScene();
    animate();

    window.addEventListener('resize', handleResize);

    return () => {
      if (refs.animationId) cancelAnimationFrame(refs.animationId);
      window.removeEventListener('resize', handleResize);

      if (refs.mesh) {
        refs.scene?.remove(refs.mesh);
        refs.mesh.geometry.dispose();
        if (refs.mesh.material instanceof THREE.Material) {
          refs.mesh.material.dispose();
        }
      }

      refs.renderer?.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full block -z-10 pointer-events-none"
    />
  );
}
