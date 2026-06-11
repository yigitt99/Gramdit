import React from 'react';
import { cn } from '@/utils';

export interface MetalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
}

export const MetalButton = React.forwardRef<HTMLButtonElement, MetalButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-full py-3 px-8 font-semibold tracking-wider uppercase text-xs",
          "text-white/95 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
          "border border-white/25 backdrop-blur-xl shadow-lg",
          "group",
          className
        )}
        style={{
          background: `
            linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 49%, rgba(0, 0, 0, 0.15) 50%, rgba(255, 255, 255, 0.1) 100%),
            repeating-linear-gradient(90deg, rgba(255, 255, 255, 0) 0px, rgba(255, 255, 255, 0) 4px, rgba(255, 255, 255, 0.01) 5px, rgba(255, 255, 255, 0) 6px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.06) 50%, rgba(255, 255, 255, 0.02) 100%)
          `,
          boxShadow: `
            inset 0 1px 1px rgba(255, 255, 255, 0.45),
            inset 0 -1px 2px rgba(0, 0, 0, 0.25),
            inset 0 6px 10px rgba(255, 255, 255, 0.05),
            0 4px 12px rgba(0, 0, 0, 0.3)
          `,
        }}
        {...props}
      >
        {/* Shine highlight animation on hover */}
        <span 
          className="absolute inset-0 w-[200%] translate-x-[-100%] bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-[100%]"
          style={{ transform: 'skewX(-20deg) translateX(-100%)' }}
        />
        
        {/* Glow effect on hover */}
        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/5 rounded-full" />

        {/* Content wrapper with clean shadow for readability */}
        <span className="relative z-10 flex items-center justify-center gap-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
          {children}
        </span>
      </button>
    );
  }
);

MetalButton.displayName = 'MetalButton';
