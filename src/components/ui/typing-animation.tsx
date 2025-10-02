'use client';

import { useEffect, useState } from 'react';

interface TypingAnimationProps {
  text: string;
  speed?: number;
  className?: string;
  showCursor?: boolean;
}

export function TypingAnimation({ 
  text, 
  speed = 50, 
  className = '', 
  showCursor = true 
}: TypingAnimationProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursorBlink, setShowCursorBlink] = useState(true);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (showCursor) {
      // Start cursor blinking after typing is complete
      const blinkInterval = setInterval(() => {
        setShowCursorBlink(prev => !prev);
      }, 500);

      return () => clearInterval(blinkInterval);
    }
  }, [currentIndex, text, speed, showCursor]);

  return (
    <span className={className}>
      {displayText}
      {showCursor && (
        <span 
          className={`inline-block w-0.5 h-6 bg-current ml-1 ${
            showCursorBlink ? 'opacity-100' : 'opacity-0'
          } transition-opacity duration-100`}
        />
      )}
    </span>
  );
}
