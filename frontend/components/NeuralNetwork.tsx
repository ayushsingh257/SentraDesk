"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

// ── Inner particle field ───────────────────────────────────────────
function ParticleField() {
  const ref = useRef<THREE.Points>(null!);
  const linesRef = useRef<THREE.LineSegments>(null!);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Generate 250 random particle positions
  const count = 250;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 4 + Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  // Generate connection lines between nearby particles
  const linePositions = useMemo(() => {
    const threshold = 1.8;
    const lines: number[] = [];
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = positions[i*3]   - positions[j*3];
        const dy = positions[i*3+1] - positions[j*3+1];
        const dz = positions[i*3+2] - positions[j*3+2];
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (dist < threshold) {
          lines.push(
            positions[i*3], positions[i*3+1], positions[i*3+2],
            positions[j*3], positions[j*3+1], positions[j*3+2],
          );
        }
      }
    }
    return new Float32Array(lines);
  }, [positions]);

  // Mouse tracking
  useMemo(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    if (typeof window !== "undefined") {
      window.addEventListener("mousemove", handleMouseMove);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      ref.current.rotation.y = t * 0.06;
      ref.current.rotation.x = t * 0.02 + mouseRef.current.y * 0.15;
      ref.current.rotation.z = mouseRef.current.x * 0.08;
    }
    if (linesRef.current) {
      linesRef.current.rotation.y = t * 0.06;
      linesRef.current.rotation.x = t * 0.02 + mouseRef.current.y * 0.15;
      linesRef.current.rotation.z = mouseRef.current.x * 0.08;
    }
  });

  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    return geo;
  }, [linePositions]);

  return (
    <group>
      {/* Connection Lines */}
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial
          color="#0ea5e9"
          transparent
          opacity={0.12}
          vertexColors={false}
        />
      </lineSegments>

      {/* Particles */}
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#38bdf8"
          size={0.025}
          sizeAttenuation
          depthWrite={false}
          opacity={0.8}
        />
      </Points>
    </group>
  );
}

// ── Outer ring of larger accent nodes ─────────────────────────────
function AccentNodes() {
  const ref = useRef<THREE.Group>(null!);

  const nodes = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2;
      const r = 3.5;
      return {
        x: Math.cos(angle) * r,
        y: (Math.random() - 0.5) * 1.5,
        z: Math.sin(angle) * r,
        color: i % 3 === 0 ? "#06b6d4" : i % 3 === 1 ? "#8b5cf6" : "#0ea5e9",
      };
    });
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      ref.current.rotation.y = t * 0.04;
    }
  });

  return (
    <group ref={ref}>
      {nodes.map((node, i) => (
        <mesh key={i} position={[node.x, node.y, node.z]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshBasicMaterial color={node.color} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ── Central glowing core ──────────────────────────────────────────
function CentralCore() {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      const scale = 1 + Math.sin(t * 2) * 0.08;
      ref.current.scale.setScalar(scale);
    }
  });

  return (
    <group>
      {/* Outer glow sphere */}
      <mesh>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.04} wireframe={false} />
      </mesh>
      {/* Core */}
      <mesh ref={ref}>
        <sphereGeometry args={[0.18, 32, 32]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.95} />
      </mesh>
      {/* Inner wireframe ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.8, 0.003, 8, 80]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.25} />
      </mesh>
      <mesh rotation={[Math.PI / 4, Math.PI / 6, 0]}>
        <torusGeometry args={[1.1, 0.003, 8, 80]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

// ── Exported Canvas component ─────────────────────────────────────
export default function NeuralNetwork() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 60 }}
      style={{ background: "transparent" }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.3} />
      <CentralCore />
      <ParticleField />
      <AccentNodes />
    </Canvas>
  );
}
