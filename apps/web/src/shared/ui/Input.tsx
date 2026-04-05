import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export function Input({ label, icon, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-2.5 text-slate-400">
            {icon}
          </span>
        )}
        <input 
          className={`glass-input w-full p-2.5 rounded-lg text-sm bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all ${icon ? 'pl-9' : ''} ${className}`}
          {...props}
        />
      </div>
    </div>
  );
}