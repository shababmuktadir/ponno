// src/components/ui/AmbientBackground.jsx
import { motion } from "framer-motion";

const ORBS = [
  { c: "var(--orb-1)", x: "-12%", y: "-18%", s: "46rem", d: 0  },
  { c: "var(--orb-2)", x: "68%",  y: "-14%", s: "42rem", d: 3  },
  { c: "var(--orb-3)", x: "58%",  y: "58%",  s: "48rem", d: 6  },
  { c: "var(--orb-4)", x: "-14%", y: "55%",  s: "40rem", d: 9  },
];

export default function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-bg" />

      {ORBS.map((o, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full will-change-transform"
          style={{
            width: o.s,
            height: o.s,
            left: o.x,
            top: o.y,
            background: `radial-gradient(circle at center, ${o.c} 0%, transparent 70%)`,
            filter: "blur(70px)",
          }}
          animate={{
            x: [0, 34, -26, 0],
            y: [0, -42, 28, 0],
            scale: [1, 1.07, 0.96, 1],
          }}
          transition={{
            duration: 24 + i * 2.5,
            delay: o.d,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Noise grain — depth এর জন্য */}
      <div
        className="absolute inset-0 mix-blend-overlay"
        style={{
          opacity: "var(--noise-opacity)",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 220 220' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}