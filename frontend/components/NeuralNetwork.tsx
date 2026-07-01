"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

// ── Spline Glass Core Shader (Inner Volumetric Glow) ────────────────
const SplineGlassCoreShader = {
  uniforms: {
    uTime: { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vModelPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vModelPosition = position;
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
    varying vec3 vModelPosition;

    // Simplex 3D Noise generator for fluid gradients
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

    float snoise(vec3 v){
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 =   v - i + dot(i, C.xxx) ;

      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );

      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;

      i = mod(i, 289.0 );
      vec4 p = permute( permute( permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

      float n_ = 0.142857142857;
      vec3  ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z *ns.z);

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );

      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );

      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);

      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                    dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
      // Create layered complex moving noise waves
      vec3 noiseCoord1 = vModelPosition * 2.5 + vec3(0.0, 0.0, uTime * 0.35);
      vec3 noiseCoord2 = vModelPosition * 4.0 - vec3(0.0, uTime * 0.25, 0.0);
      
      float n1 = snoise(noiseCoord1);
      float n2 = snoise(noiseCoord2);
      float combinedNoise = (n1 + n2 * 0.5 + 0.5) / 1.5;

      // Premium Cyber Palette Gradients
      vec3 cyan = vec3(0.0, 0.92, 1.0);
      vec3 blue = vec3(0.02, 0.28, 0.95);
      vec3 purple = vec3(0.44, 0.0, 0.98);
      vec3 magenta = vec3(0.95, 0.0, 0.55);

      // Smooth interpolation of colors
      float mixFactor = clamp(vModelPosition.y * 0.45 + 0.5 + combinedNoise * 0.3, 0.0, 1.0);
      vec3 grad1 = mix(blue, cyan, mixFactor);
      vec3 grad2 = mix(purple, magenta, mixFactor);
      
      // Dynamic shift over time
      vec3 finalColor = mix(grad1, grad2, sin(uTime * 0.4) * 0.5 + 0.5);

      // Subsurface / Depth glow density
      vec3 viewDir = normalize(vViewPosition);
      vec3 normal = normalize(vNormal);
      float rim = 1.0 - max(dot(normal, viewDir), 0.0);
      float centerGlow = pow(1.0 - rim, 2.8);

      vec3 coreGlow = finalColor * (centerGlow + 0.3) + magenta * pow(rim, 4.0) * 0.5;

      gl_FragColor = vec4(coreGlow, centerGlow * 0.88 + 0.12);
    }
  `,
};

// ── Spline Glass Shell Shader (Glossy Glass Reflective Outer Layer) ──
const SplineGlassShellShader = {
  uniforms: {
    uTime: { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vModelPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vModelPosition = position;
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
    varying vec3 vModelPosition;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);

      // Fresnel factor for reflection
      float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.5);

      // Multi-source glossy specular highlights
      vec3 lightDir1 = normalize(vec3(5.0, 6.0, 4.0));
      vec3 lightDir2 = normalize(vec3(-4.0, 3.0, 2.0));
      
      vec3 halfDir1 = normalize(lightDir1 + viewDir);
      vec3 halfDir2 = normalize(lightDir2 + viewDir);

      // High-shininess glossy specular calculation
      float spec1 = pow(max(dot(normal, halfDir1), 0.0), 128.0);
      float spec2 = pow(max(dot(normal, halfDir2), 0.0), 45.0);
      
      vec3 specColor = vec3(1.0) * spec1 * 0.95 + vec3(0.0, 0.85, 1.0) * spec2 * 0.4;

      // Soft iridescence reflection at the edge
      vec3 glassBase = vec3(0.03, 0.45, 0.85);
      vec3 violetRim = vec3(0.75, 0.15, 0.95);
      float rimShift = sin(atan(normal.y, normal.x) + uTime * 0.25) * 0.5 + 0.5;
      vec3 rimReflection = mix(glassBase, violetRim, rimShift);

      // Transparency: high center visibility, high reflection opacity on edges
      float opacity = mix(0.14, 0.78, fresnel);

      // Combined look: glass body + fresnel reflection + specular shine
      vec3 glassOutput = rimReflection * fresnel * 0.95 + specColor;

      gl_FragColor = vec4(glassOutput, opacity);
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
      
      // Edge falloff intensity
      float intensity = pow(0.78 - dot(normal, viewDir), 2.8);
      
      // Dynamic shift between cyan and purple
      vec3 glowColor = mix(vec3(0.0, 0.8, 1.0), vec3(0.48, 0.0, 1.0), 0.5);
      
      gl_FragColor = vec4(glowColor * intensity * 1.2, intensity * 0.6);
    }
  `,
};

// ── Parallax Deep Space Star Field ───────────────────────────
function DeepSpaceStars() {
  const count = 350;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 8.0 + Math.random() * 15.0;
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
      ref.current.rotation.y = elapsed * 0.005;
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

// ── Glowing Plasma Reactor Core (Spline Materials Layered) ───────────────────
interface ReactorProps {
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}

function PlasmaReactor({ mouse }: ReactorProps) {
  const mainGroup = useRef<THREE.Group>(null!);
  const coreMat = useRef<THREE.ShaderMaterial>(null!);
  const shellMat = useRef<THREE.ShaderMaterial>(null!);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    
    // Update uTime on both core & glass shell
    if (coreMat.current) {
      coreMat.current.uniforms.uTime.value = elapsed;
    }
    if (shellMat.current) {
      shellMat.current.uniforms.uTime.value = elapsed;
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
      const t = scroll / 0.25;
      targetX = -2.3 * t;
      targetY = 0.3 * t;
      targetZ = 0.5 * t;
      targetScale = 1.0 + 0.25 * t;
    } else if (scroll < 0.55) {
      const t = (scroll - 0.25) / 0.30;
      targetX = -2.3 + 4.6 * t;
      targetY = 0.3 - 0.6 * t;
      targetZ = 0.5 - 0.5 * t;
      targetScale = 1.25 - 0.15 * t;
      rotationScale = 1.3;
    } else if (scroll < 0.80) {
      const t = (scroll - 0.55) / 0.25;
      targetX = 2.3 - 2.3 * t;
      targetY = -0.3 - 1.2 * t;
      targetZ = 1.0 * t;
      targetScale = 1.1 + 0.3 * t;
      rotationScale = 2.0;
    } else {
      const t = (scroll - 0.80) / 0.20;
      targetX = 0;
      targetY = -1.5 + 1.5 * t;
      targetZ = 1.0 - 5.5 * t;
      targetScale = 1.4 - 0.85 * t;
      rotationScale = 0.4;
    }

    // Apply linear interpolation
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
      
      {/* Dynamic light source to illuminate the environment */}
      <pointLight position={[0, 0, 0]} color="#00d8ff" intensity={6.0} distance={15} decay={1.3} />

      {/* Layer 1: Inner Volumetric Shader (Subsurface Glow & Shifting Gradients) */}
      <mesh>
        <sphereGeometry args={[0.62, 64, 64]} />
        <shaderMaterial
          ref={coreMat}
          attach="material"
          {...SplineGlassCoreShader}
          transparent={true}
        />
      </mesh>

      {/* Layer 2: Outer Glass Shell Shader (Glossy specular highlights, fresnel & refraction) */}
      <mesh>
        <sphereGeometry args={[0.70, 64, 64]} />
        <shaderMaterial
          ref={shellMat}
          attach="material"
          {...SplineGlassShellShader}
          transparent={true}
          depthWrite={false}
        />
      </mesh>

      {/* Layer 3: Soft Volumetric Corona Additive Glow */}
      <mesh>
        <sphereGeometry args={[0.82, 48, 48]} />
        <shaderMaterial
          attach="material"
          {...CoronaGlowShader}
          transparent={true}
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
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 4, 5]} intensity={0.9} color="#00eeff" />
      
      <DeepSpaceStars />
      <PlasmaReactor mouse={mouse} />
    </Canvas>
  );
}
