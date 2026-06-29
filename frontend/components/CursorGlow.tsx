"use client";

import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -200, y: -200 });
  const ring = useRef({ x: -200, y: -200 });
  const rafId = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      // Glow follows cursor instantly
      if (glowRef.current) {
        glowRef.current.style.left = `${pos.current.x}px`;
        glowRef.current.style.top = `${pos.current.y}px`;
      }

      // Ring follows with lag (lerp)
      ring.current.x += (pos.current.x - ring.current.x) * 0.12;
      ring.current.y += (pos.current.y - ring.current.y) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.left = `${ring.current.x}px`;
        ringRef.current.style.top = `${ring.current.y}px`;
      }

      rafId.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    rafId.current = requestAnimationFrame(animate);

    // Hide on mouse leave
    const handleLeave = () => {
      pos.current = { x: -200, y: -200 };
      ring.current = { x: -200, y: -200 };
    };
    window.addEventListener("mouseleave", handleLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleLeave);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <>
      {/* Glow dot */}
      <div
        ref={glowRef}
        className="pointer-events-none fixed z-[9998]"
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: "#38bdf8",
          transform: "translate(-50%, -50%)",
          boxShadow: "0 0 10px 2px rgba(56,189,248,0.6), 0 0 30px 8px rgba(56,189,248,0.15)",
          transition: "opacity 0.2s ease",
          mixBlendMode: "screen",
        }}
      />
      {/* Lagging ring */}
      <div
        ref={ringRef}
        className="pointer-events-none fixed z-[9997]"
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          border: "1px solid rgba(56,189,248,0.35)",
          transform: "translate(-50%, -50%)",
          transition: "opacity 0.2s ease",
          backdropFilter: "none",
        }}
      />
    </>
  );
}
