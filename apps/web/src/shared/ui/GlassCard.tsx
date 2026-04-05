import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function GlassCard({ children, className = '', onClick }: GlassCardProps) {
  const baseClasses = 'glass-card rounded-xl p-4 shadow-sm bg-white border border-slate-200';
  const interactiveClasses = onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all' : '';
  
  return (
    <div 
      className={`${baseClasses} ${interactiveClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}