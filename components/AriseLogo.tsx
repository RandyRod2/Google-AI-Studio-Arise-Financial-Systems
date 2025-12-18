
import React from 'react';

export const AriseLogo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="sphereGradient" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#3b82f6" /> {/* Blue 500 */}
        <stop offset="100%" stopColor="#0ea5e9" /> {/* Sky 500 */}
      </linearGradient>
      <linearGradient id="aGradient" x1="50" y1="50" x2="150" y2="150" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#bae6fd" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* Sphere Background */}
    <circle cx="100" cy="100" r="90" fill="url(#sphereGradient)" />
    
    {/* Network / Constellation Effect */}
    <g opacity="0.4">
        <circle cx="60" cy="60" r="2" fill="white" />
        <circle cx="140" cy="60" r="2" fill="white" />
        <circle cx="100" cy="140" r="2" fill="white" />
        <line x1="60" y1="60" x2="140" y2="60" stroke="white" strokeWidth="0.5" />
        <line x1="60" y1="60" x2="100" y2="140" stroke="white" strokeWidth="0.5" />
        <line x1="140" y1="60" x2="100" y2="140" stroke="white" strokeWidth="0.5" />
    </g>

    {/* The 'A' Symbol */}
    <path 
      d="M100 45 L145 145 L125 145 L100 85 L75 145 L55 145 L100 45 Z" 
      fill="url(#aGradient)" 
      filter="url(#glow)"
    />
    <path 
      d="M78 120 L122 120" 
      stroke="url(#aGradient)" 
      strokeWidth="8" 
      strokeLinecap="round"
    />
  </svg>
);
