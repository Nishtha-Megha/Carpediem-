import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
export function ScrollReveal({
  children,
  delay = 0,
  direction = "up",
  distance = 32,
  className,
  once = true
}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);
  const offsetMap = {
    up: { y: distance, x: 0 },
    down: { y: -distance, x: 0 },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
    none: { x: 0, y: 0 }
  };
  const offset = offsetMap[direction];
  return <motion.div
    ref={ref}
    initial={{ opacity: 0, ...offset }}
    animate={inView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...offset }}
    transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
      {children}
    </motion.div>;
}
