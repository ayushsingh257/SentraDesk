"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

// ── Floating Ambient Particle Field ───────────────────────────
function BackgroundDust() {
  const count = 180;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 15;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }
    return pos;
  }, []);

  const ref = useRef<THREE.Points>(null!);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      ref.current.rotation.y = t * 0.015;
      ref.current.rotation.x = t * 0.008;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#38bdf8"
        size={0.018}
        sizeAttenuation
        depthWrite={false}
        opacity={0.35}
      />
    </Points>
  );
}

// ── Interactive Holographic Reactor Core ───────────────────────
interface ReactorProps {
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}

function CyberReactorCore({ mouse }: ReactorProps) {
  const reactorGroup = useRef<THREE.Group>(null!);
  const ring1 = useRef<THREE.Mesh>(null!);
  const ring2 = useRef<THREE.Mesh>(null!);
  const ring3 = useRef<THREE.Mesh>(null!);
  const centralSphere = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    
    // Calculate scroll progress percentage (0.0 to 1.0)
    const scroll = typeof window !== "undefined"
      ? window.scrollY / (document.documentElement.scrollHeight - window.innerHeight || 1)
      : 0;

    // Define coordinate targets along scroll phases
    let targetX = 0;
    let targetY = 0;
    let targetZ = 0;
    let targetScale = 1.0;
    let rotationMultiplier = 1.0;
    let opacityTarget = 0.85;

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
      rotationMultiplier = 1.3;
    } else if (scroll < 0.80) {
      // Phase 3: Slide Right -> Center Down
      const t = (scroll - 0.55) / 0.25;
      targetX = 2.3 - 2.3 * t;
      targetY = -0.3 - 1.2 * t;
      targetZ = 1.0 * t;
      targetScale = 1.1 + 0.3 * t;
      rotationMultiplier = 2.0;
    } else {
      // Phase 4: Center Down -> Deep Ambient Background
      const t = (scroll - 0.80) / 0.20;
      targetX = 0;
      targetY = -1.5 + 1.5 * t;
      targetZ = 1.0 - 5.5 * t;
      targetScale = 1.4 - 0.85 * t;
      rotationMultiplier = 0.5;
      opacityTarget = 0.85 - 0.5 * t;
    }

    // Apply linear interpolation for smooth cinematic slides
    if (reactorGroup.current) {
      reactorGroup.current.position.x += (targetX - reactorGroup.current.position.x) * 0.08;
      reactorGroup.current.position.y += (targetY - reactorGroup.current.position.y) * 0.08;
      reactorGroup.current.position.z += (targetZ - reactorGroup.current.position.z) * 0.08;

      const currentScale = reactorGroup.current.scale.x;
      const nextScale = currentScale + (targetScale - currentScale) * 0.08;
      reactorGroup.current.scale.set(nextScale, nextScale, nextScale);

      // Micro mouse tilt interactions
      reactorGroup.current.rotation.y = (elapsed * 0.06 + mouse.current.x * 0.15) * rotationMultiplier;
      reactorGroup.current.rotation.x = (elapsed * 0.03 + mouse.current.y * 0.15) * rotationMultiplier;
    }

    // Concentric spin updates
    if (ring1.current) {
      ring1.current.rotation.x = elapsed * 0.22;
      ring1.current.rotation.y = elapsed * 0.12;
    }
    if (ring2.current) {
      ring2.current.rotation.y = -elapsed * 0.32;
      ring2.current.rotation.z = elapsed * 0.18;
    }
    if (ring3.current) {
      ring3.current.rotation.x = -elapsed * 0.14;
      ring3.current.rotation.z = -elapsed * 0.26;
    }

    // Pulse central core size & glowing look
    if (centralSphere.current) {
      const pulse = 1.0 + Math.sin(elapsed * 2.5) * 0.06;
      centralSphere.current.scale.setScalar(pulse);
      const mat = centralSphere.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = opacityTarget;
      }
    }
  });

  return (
    <group ref={reactorGroup}>
      
      {/* Central Fusion Core */}
      <mesh ref={centralSphere}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.85} wireframe={false} />
      </mesh>

      {/* Orbiting core grid helper */}
      <mesh>
        <sphereGeometry args={[0.71, 16, 16]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.12} wireframe={true} />
      </mesh>

      {/* Outer Holographic Energy Ring 1 */}
      <mesh ref={ring1}>
        <torusGeometry args={[1.5, 0.02, 8, 64]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.4} />
      </mesh>

      {/* Concentric Energy Ring 2 */}
      <mesh ref={ring2} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <torusGeometry args={[1.9, 0.015, 6, 64]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.3} />
      </mesh>

      {/* Outer Defense Ring 3 */}
      <mesh ref={ring3} rotation={[-Math.PI / 4, -Math.PI / 6, 0]}>
        <torusGeometry args={[2.3, 0.01, 4, 48]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.2} />
      </mesh>

      {/* Holographic orbital ticks */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 2.7;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <mesh key={i} position={[x, 0, z]}>
            <boxGeometry args={[0.04, 0.04, 0.04]} />
            <meshBasicMaterial color="#0ea5e9" transparent opacity={0.5} />
          </mesh>
        );
      })}

    </group>
  );
}

// ── Main Canvas Component ───────────────────────────────────────
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
      <ambientLight intensity={0.5} />
      <BackgroundDust />
      <CyberReactorCore mouse={mouse} />
    </Canvas>
  );
}
