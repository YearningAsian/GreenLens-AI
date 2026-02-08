"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Direction = "up" | "left" | "right";

interface SlideInProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;        // ms
  className?: string;
}

/**
 * Wraps children and slides them in on first intersection.
 * Uses IntersectionObserver — triggers once, then disconnects.
 */
export function SlideIn({ children, direction = "up", delay = 0, className = "" }: SlideInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const animClass = visible ? `slide-${direction}` : "slide-hidden";

  return (
    <div
      ref={ref}
      className={`${animClass} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
