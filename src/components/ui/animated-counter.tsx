'use client';

import { useEffect, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  delay?: number;
  className?: string;
}

export function AnimatedCounter({ value, duration = 2000, delay = 500, className = '' }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Only animate if we haven't animated yet and value is greater than 0
    if (hasAnimated || value === 0) {
      setCount(value);
      return;
    }

    let delayTimeout: NodeJS.Timeout;
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Enhanced easing function for smoother animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.floor(easeOutCubic * value);
      
      setCount(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        // Animation completed
        setCount(value);
        setHasAnimated(true);
        setIsAnimating(false);
      }
    };

    // Start animation after delay
    delayTimeout = setTimeout(() => {
      setIsAnimating(true);
      animationFrame = requestAnimationFrame(animate);
    }, delay);

    return () => {
      if (delayTimeout) clearTimeout(delayTimeout);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration, delay, hasAnimated]);

  return (
    <span className={`${className} ${isAnimating && !hasAnimated ? 'animate-pulse' : ''} transition-all duration-300`}>
      {count}
    </span>
  );
}
