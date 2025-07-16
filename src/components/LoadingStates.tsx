import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <motion.div
      className={`${sizes[size]} border-2 border-accent/20 border-t-accent rounded-full ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  );
}

interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className = '' }: LoadingDotsProps) {
  const dotVariants = {
    initial: { y: 0 },
    animate: {
      y: [-8, 0, -8],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-2 h-2 bg-accent rounded-full"
          variants={dotVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: index * 0.2 }}
        />
      ))}
    </div>
  );
}

interface LoadingPulseProps {
  className?: string;
}

export function LoadingPulse({ className = '' }: LoadingPulseProps) {
  return (
    <motion.div
      className={`bg-accent/20 rounded-lg ${className}`}
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className = '', lines = 1 }: SkeletonProps) {
  const pulseVariants = {
    animate: {
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  if (lines === 1) {
    return (
      <motion.div
        className={`bg-surface-100/20 rounded-lg ${className}`}
        variants={pulseVariants}
        animate="animate"
      />
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <motion.div
          key={index}
          className={`bg-surface-100/20 rounded-lg h-4 ${
            index === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
          variants={pulseVariants}
          animate="animate"
          transition={{ delay: index * 0.1 }}
        />
      ))}
    </div>
  );
}

interface ProgressBarProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
}

export function ProgressBar({ 
  progress, 
  className = '', 
  showPercentage = false 
}: ProgressBarProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="bg-surface-100/20 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-accent to-accent/80 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </div>
      {showPercentage && (
        <motion.div
          className="text-sm text-text-secondary mt-1 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {Math.round(progress)}%
        </motion.div>
      )}
    </div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
}

export function LoadingOverlay({ 
  isLoading, 
  children, 
  className = '' 
}: LoadingOverlayProps) {
  return (
    <div className={`relative ${className}`}>
      {children}
      <motion.div
        className="absolute inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center rounded-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{ pointerEvents: isLoading ? 'auto' : 'none' }}
      >
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <motion.p
            className="mt-4 text-text-secondary"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isLoading ? 1 : 0, y: isLoading ? 0 : 10 }}
            transition={{ delay: 0.2 }}
          >
            Loading...
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}

// Card skeleton for blog posts and projects
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`p-6 rounded-lg border border-card-border bg-surface-100/5 ${className}`}>
      <Skeleton className="h-40 w-full mb-4" />
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton lines={2} className="mb-4" />
      <div className="flex space-x-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-14" />
      </div>
    </div>
  );
}

// Page loading skeleton
export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen pt-16">
      <div className="container-base py-16">
        <Skeleton className="h-12 w-1/2 mb-8" />
        <Skeleton lines={3} className="mb-12" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}