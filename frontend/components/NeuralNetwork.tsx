"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

// ── Plasma Sun Surface Shader Material ────────────────────────
const PlasmaSurfaceShader = {
  uniforms: {
    uTime: { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    // Simplex noise / fBm noise generators
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                 mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
    }
    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      vec2 shift = vec2(100.0);
      mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
      for (int i = 0; i < 4; ++i) {
        v += a * noise(p);
        p = rot * p * 2.0 + shift;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      // Flowing plasma coords
      vec2 uv = vUv * 3.5;
      float n1 = fbm(uv + vec2(uTime * 0.12, uTime * 0.06));
      float n2 = fbm(uv - vec2(uTime * 0.08, -uTime * 0.10));
      float finalNoise = mix(n1, n2, 0.5);

      // Fresnel glow normal computation
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = pow(1.0 - dot(normal, viewDir), 2.2);

      // Cyber plasma color palettes (Cyan core, deep indigo flares, bright cyan rims)
      vec3 coreColor = vec3(0.05, 0.70, 0.90);
      vec3 flareColor = vec3(0.38, 0.08, 0.75);
      vec3 rimColor = vec3(0.20, 0.85, 1.00);

      vec3 base = mix(coreColor, flareColor, finalNoise);
      vec3 finalColor = base + rimColor * fresnel * 1.6;

      gl_FragColor = vec4(finalColor, 0.92);
    }
  `,
};

// ── Sun Corona Glow Halo Shader ──────────────────────────────
const CoronaGlowShader = {
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      // Soft atmospheric glow edge falloff
      float intensity = pow(0.78 - dot(normal, viewDir), 2.8);
      gl_FragColor = vec4(vec3(0.08, 0.65, 0.95) * intensity, intensity * 0.55);
    }
  `,
};

// ── Parallax Deep Space Star Field ───────────────────────────
function DeepSpaceStars() {
  const count = 350;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Scatter in wider spherical shell for depth
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 8.0 + Math.random() * 15.0; // distant stars
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  const ref = useRef<THREE.Points>(null!);
  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    if (ref.current) {
      ref.current.rotation.y = elapsed * 0.005; // very slow drift
      ref.current.rotation.z = elapsed * 0.002;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#38bdf8"
        size={0.02}
        sizeAttenuation
        depthWrite={false}
        opacity={0.45}
      />
    </Points>
  );
}

// ── Layered Cyber Orbit Rings ──────────────────────────────────
function LayeredOrbitRings() {
  const ring1 = useRef<THREE.Mesh>(null!);
  const ring2 = useRef<THREE.Mesh>(null!);
  const ring3 = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    if (ring1.current) {
      ring1.current.rotation.x = t * 0.15;
      ring1.current.rotation.y = t * 0.08;
    }
    if (ring2.current) {
      ring2.current.rotation.y = -t * 0.22;
      ring2.current.rotation.z = t * 0.12;
    }
    if (ring3.current) {
      ring3.current.rotation.x = -t * 0.10;
      ring3.current.rotation.z = -t * 0.18;
    }
  });

  return (
    <group>
      {/* Layer 1 Torus */}
      <mesh ref={ring1}>
        <torusGeometry args={[1.5, 0.015, 8, 64]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.35} />
      </mesh>

      {/* Layer 2 Torus - Detuned Rotation */}
      <mesh ref={ring2} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <torusGeometry args={[1.9, 0.012, 6, 64]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.25} />
      </mesh>

      {/* Layer 3 Torus */}
      <mesh ref={ring3} rotation={[-Math.PI / 4, -Math.PI / 6, 0]}>
        <torusGeometry args={[2.3, 0.008, 4, 48]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.15} />
      </mesh>

      {/* Subtle orbital data points (streaks representation) */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 1.9;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <mesh key={i} position={[x, 0, z]}>
            <sphereGeometry args={[0.022, 6, 6]} />
            <meshBasicMaterial color="#0ea5e9" transparent opacity={0.6} />
          </mesh>
        );
      })}
    </group>
  );
}

// ── Glowing Plasma Reactor Core ────────────────────────────────
interface ReactorProps {
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}

function PlasmaReactor({ mouse }: ReactorProps) {
  const mainGroup = useRef<THREE.Group>(null!);
  const surfaceMat = useRef<THREE.ShaderMaterial>(null!);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    
    // Update shader uTime
    if (surfaceMat.current) {
      surfaceMat.current.uniforms.uTime.value = elapsed;
    }

    // Scroll interpolation target math (0.0 to 1.0)
    const scroll = typeof window !== "undefined"
      ? window.scrollY / (document.documentElement.scrollHeight - window.innerHeight || 1)
      : 0;

    let targetX = 0;
    let targetY = 0;
    let targetZ = 0;
    let targetScale = 1.0;
    let rotationScale = 1.0;

    if (scroll < 0.25) {
      // Phase 1: Hero Centered -> Left (Scroll zoom in)
      const t = scroll / 0.25;
      targetX = -2.3 * t;
      targetY = 0.3 * t;
      targetZ = 0.5 * t;
      targetScale = 1.0 + 0.25 * t;
    } else if (scroll < 0.55) {
      // Phase 2: Left -> Slide Right
      const t = (scroll - 0.25) / 0.30;
      targetX = -2.3 + 4.6 * t;
      targetY = 0.3 - 0.6 * t;
      targetZ = 0.5 - 0.5 * t;
      targetScale = 1.25 - 0.15 * t;
      rotationScale = 1.3;
    } else if (scroll < 0.80) {
      // Phase 3: Slide Right -> Center Down
      const t = (scroll - 0.55) / 0.25;
      targetX = 2.3 - 2.3 * t;
      targetY = -0.3 - 1.2 * t;
      targetZ = 1.0 * t;
      targetScale = 1.1 + 0.3 * t;
      rotationScale = 2.0;
    } else {
      // Phase 4: Center Down -> Deep Ambient Background
      const t = (scroll - 0.80) / 0.20;
      targetX = 0;
      targetY = -1.5 + 1.5 * t;
      targetZ = 1.0 - 5.5 * t;
      targetScale = 1.4 - 0.85 * t;
      rotationScale = 0.4;
    }

    // Apply linear interpolation with lower coefficient (0.055) for cinematic inertia
    if (mainGroup.current) {
      mainGroup.current.position.x += (targetX - mainGroup.current.position.x) * 0.055;
      mainGroup.current.position.y += (targetY - mainGroup.current.position.y) * 0.055;
      mainGroup.current.position.z += (targetZ - mainGroup.current.position.z) * 0.055;

      const currentScale = mainGroup.current.scale.x;
      const nextScale = currentScale + (targetScale - currentScale) * 0.055;
      mainGroup.current.scale.set(nextScale, nextScale, nextScale);

      // Micro mouse tilt interactions
      mainGroup.current.rotation.y = (elapsed * 0.05 + mouse.current.x * 0.12) * rotationScale;
      mainGroup.current.rotation.x = (elapsed * 0.02 + mouse.current.y * 0.12) * rotationScale;
    }
  });

  return (
    <group ref={mainGroup}>
      
      {/* Core Dynamic light source: casts light on nearby rings and stars */}
      <pointLight position={[0, 0, 0]} color="#06b6d4" intensity={4.5} distance={15} decay={1.4} />

      {/* Plasma Sun Mesh with Custom GLSL Shader */}
      <mesh>
        <sphereGeometry args={[0.7, 40, 40]} />
        <shaderMaterial
          ref={surfaceMat}
          attach="material"
          {...PlasmaSurfaceShader}
        />
      </mesh>

      {/* Volumetric Corona Halo Glow (fades outwards) */}
      <mesh>
        <sphereGeometry args={[0.82, 40, 40]} />
        <shaderMaterial
          attach="material"
          {...CoronaGlowShader}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Orbital layered rings */}
      <LayeredOrbitRings />

    </group>
  );
}

// ── Main Canvas Viewport ────────────────────────────────────────
export default function NeuralNetwork() {
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 55 }}
      style={{ background: "transparent" }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[2, 3, 5]} intensity={0.8} color="#ffffff" />
      
      <DeepSpaceStars />
      <PlasmaReactor mouse={mouse} />
    </Canvas>
  );
}
