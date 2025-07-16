import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface AnimatedButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export default function AnimatedButton({
  children,
  href,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
}: AnimatedButtonProps) {
  const baseClasses = 'relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden';
  
  const variantClasses = {
    primary: 'bg-accent text-white hover:bg-accent/90 shadow-lg hover:shadow-xl',
    secondary: 'bg-surface-100/10 text-text-primary hover:bg-surface-100/20 border border-card-border',
    outline: 'border-2 border-accent text-accent hover:bg-accent hover:text-white',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-lg',
    lg: 'px-8 py-4 text-lg rounded-xl',
  };

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  // Animation variants
  const buttonVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.02,
      transition: { duration: 0.2, ease: 'easeInOut' }
    },
    tap: { 
      scale: 0.98,
      transition: { duration: 0.1, ease: 'easeInOut' }
    },
  };

  const shimmerVariants = {
    initial: { x: '-100%' },
    hover: { 
      x: '100%',
      transition: { duration: 0.6, ease: 'easeInOut' }
    },
  };

  const glowVariants = {
    initial: { opacity: 0, scale: 0.8 },
    hover: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.3, ease: 'easeInOut' }
    },
  };

  const content = (
    <motion.button
      className={buttonClasses}
      variants={buttonVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-lg bg-gradient-to-r from-accent/20 to-accent/40 blur-lg"
        variants={glowVariants}
        initial="initial"
        whileHover="hover"
      />
      
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        variants={shimmerVariants}
        initial="initial"
        whileHover="hover"
      />
      
      {/* Content */}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );

  if (href) {
    return (
      <motion.a
        href={href}
        className="inline-block"
        variants={buttonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
      >
        <div className={buttonClasses}>
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-lg bg-gradient-to-r from-accent/20 to-accent/40 blur-lg"
            variants={glowVariants}
            initial="initial"
            whileHover="hover"
          />
          
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            variants={shimmerVariants}
            initial="initial"
            whileHover="hover"
          />
          
          {/* Content */}
          <span className="relative z-10">{children}</span>
        </div>
      </motion.a>
    );
  }

  return content;
}