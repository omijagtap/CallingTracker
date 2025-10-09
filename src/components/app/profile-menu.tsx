"use client";

import { useState, useEffect, useRef } from "react";

export function ProfileMenu({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current) return;
      if (ref.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const displayName = user?.name || user?.email || 'upGrad01';
  const initial = (displayName && displayName.charAt(0).toUpperCase()) || 'U';

  return (
    <div className="relative" ref={ref}>
      <button
        title={displayName}
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent/10 hover:text-accent-foreground rounded-full h-10 w-10 bg-transparent border-0"
        onClick={() => setOpen(o => !o)}
        aria-label={`Profile for ${displayName}`}
      >
        {/* Transparent circular initial; matches website transparent look */}
        <span className="h-8 w-8 flex items-center justify-center rounded-full bg-transparent text-sm font-medium text-foreground">{initial}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border rounded-md shadow-lg z-40">
          <div className="px-3 py-3 text-sm">Signed in as <br /><strong>{displayName}</strong></div>
          <div className="border-t px-2 py-2">
            <button className="w-full text-left px-2 py-2 hover:bg-gray-50 rounded" onClick={() => { setOpen(false); onLogout(); }}>Logout</button>
          </div>
        </div>
      )}
    </div>
  );
}
