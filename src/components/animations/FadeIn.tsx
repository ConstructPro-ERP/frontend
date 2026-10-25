// src/components/animations/FadeIn.tsx
"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  /** Delay in seconds before the animation starts */
  delay?: number;
  className?: string;
}

/**
 * FadeIn — a lightweight client component that wraps its children in a
 * simple opacity fade-in animation via framer-motion. Used inside Server
 * Components like page.tsx without forcing them to become client components.
 */
export default function FadeIn({
  children,
  delay = 0,
  className,
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
