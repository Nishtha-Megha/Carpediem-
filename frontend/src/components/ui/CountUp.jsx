import { useEffect, useRef, useState } from "react";
export function CountUp({
  end,
  duration = 2e3,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = ""
}) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) setStarted(true);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);
  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    const factor = Math.pow(10, decimals);
    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * end * factor) / factor);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [started, end, duration, decimals]);
  const display = decimals > 0 ? value.toFixed(decimals) : value.toLocaleString();
  return <span ref={ref} className={className}>
      {prefix}{display}{suffix}
    </span>;
}
