import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton, SkeletonText, SkeletonButton, SkeletonBadge } from '../ui/Skeleton';
import { cn } from '../../utils/cn';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';

export interface StandardPageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
    className?: string;
    ariaLabel?: string;
  };
  actions?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  loadingMessage?: string;
  variant?: 'default' | 'centered' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
}

export const StandardPageHeader: React.FC<StandardPageHeaderProps> = ({
  title,
  description,
  subtitle,
  badge,
  actions,
  className = '',
  isLoading = false,
  loadingMessage,
  variant = 'default',
  size = 'md'
}) => {
  const { isMobile, getTouchTargetClass } = useMobileOptimization();

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut'
      }
    }
  };

  const badgeVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    }
  };

  const actionsVariants: Variants = {
    hidden: { opacity: 0, x: 20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
        delay: 0.2
      }
    }
  };

  const loadingVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        duration: 0.3
      }
    },
    exit: { 
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  };

  // Skeleton loading state
  const getSkeletonLayout = () => {
    if (variant === 'centered') {
      return (
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Skeleton width={200} height={size === 'lg' ? 40 : size === 'sm' ? 24 : 32} />
            {badge && <SkeletonBadge />}
          </div>
          {subtitle && <SkeletonText lines={1} className="max-w-md mx-auto" />}
          <SkeletonText lines={2} className="max-w-2xl mx-auto" />
        </div>
      );
    }

    if (variant === 'minimal') {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton width={150} height={size === 'lg' ? 40 : size === 'sm' ? 24 : 32} />
            {badge && <SkeletonBadge />}
          </div>
          {subtitle && <SkeletonText lines={1} />}
          <SkeletonText lines={1} />
        </div>
      );
    }

    // Default variant
    return (
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton width={200} height={size === 'lg' ? 40 : size === 'sm' ? 24 : 32} />
            {badge && <SkeletonBadge />}
          </div>
          {subtitle && <SkeletonText lines={1} />}
          <SkeletonText lines={1} />
        </div>
        {actions && (
          <div className="flex gap-2 mt-4 md:mt-0">
            <SkeletonButton />
            <SkeletonButton />
          </div>
        )}
      </div>
    );
  };

  // Size-based configurations
  const sizeConfig = {
    sm: {
      title: 'text-2xl font-bold text-foreground',
      description: 'text-xs text-muted-foreground',
      padding: 'p-4',
      gap: 'gap-3'
    },
    md: {
      title: 'text-3xl font-bold text-foreground',
      description: 'text-sm text-muted-foreground',
      padding: 'p-6',
      gap: 'gap-4'
    },
    lg: {
      title: 'text-4xl font-bold text-foreground',
      description: 'text-base text-muted-foreground',
      padding: 'p-8',
      gap: 'gap-6'
    }
  };

  const config = sizeConfig[size];

  // Variant-based layouts
  const getVariantClasses = () => {
    switch (variant) {
      case 'centered':
        return 'text-center';
      case 'minimal':
        return 'flex-col';
      default:
        return 'flex-col md:flex-row md:items-center md:justify-between';
    }
  };

  const getContentLayout = () => {
    if (variant === 'centered') {
      return (
        <motion.div 
          className="text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="flex items-center justify-center gap-3 mb-2"
            variants={itemVariants}
          >
            <motion.h1 
              className={config.title}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              {title}
            </motion.h1>
            <AnimatePresence>
              {badge && (
                <motion.div
                  variants={badgeVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Badge
                    variant={badge.variant || 'default'}
                    className={cn(
                      badge.className,
                      isLoading && "opacity-50"
                    )}
                    aria-label={badge.ariaLabel}
                  >
                    {badge.text}
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <AnimatePresence>
            {subtitle && (
              <motion.p 
                className={cn(config.description, "font-medium")}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                {subtitle}
              </motion.p>
            )}
          </AnimatePresence>
          <motion.div variants={itemVariants}>
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.p 
                  key="loading"
                  className={cn(config.description, "mt-1")}
                  variants={loadingVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {loadingMessage || 'Loading...'}
                </motion.p>
              ) : (
                <motion.p 
                  key="description"
                  className={cn(config.description, "mt-1")}
                  variants={loadingVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {description}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      );
    }

    if (variant === 'minimal') {
      return (
        <motion.div 
          className="space-y-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="flex items-center gap-3"
            variants={itemVariants}
          >
            <motion.h1 
              className={config.title}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              {title}
            </motion.h1>
            <AnimatePresence>
              {badge && (
                <motion.div
                  variants={badgeVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Badge
                    variant={badge.variant || 'default'}
                    className={cn(
                      badge.className,
                      isLoading && "opacity-50"
                    )}
                    aria-label={badge.ariaLabel}
                  >
                    {badge.text}
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <AnimatePresence>
            {subtitle && (
              <motion.p 
                className={cn(config.description, "font-medium")}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                {subtitle}
              </motion.p>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {description && (
              <motion.div variants={itemVariants}>
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.p 
                      key="loading"
                      className={cn(config.description, "mt-1")}
                      variants={loadingVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      {loadingMessage || 'Loading...'}
                    </motion.p>
                  ) : (
                    <motion.p 
                      key="description"
                      className={cn(config.description, "mt-1")}
                      variants={loadingVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      {description}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      );
    }

    // Default variant
    return (
      <motion.div 
        className="w-full flex flex-col md:flex-row md:items-center md:justify-between"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="flex-1 min-w-0" variants={itemVariants}>
          <motion.div 
            className="flex items-center gap-3"
            variants={itemVariants}
          >
            <motion.h1 
              className={config.title}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              {title}
            </motion.h1>
            <AnimatePresence>
              {badge && (
                <motion.div
                  variants={badgeVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Badge
                    variant={badge.variant || 'default'}
                    className={cn(
                      badge.className,
                      isLoading && "opacity-50"
                    )}
                    aria-label={badge.ariaLabel}
                  >
                    {badge.text}
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <AnimatePresence>
            {subtitle && (
              <motion.p 
                className={cn(config.description, "font-medium mt-1")}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                {subtitle}
              </motion.p>
            )}
          </AnimatePresence>
          <motion.div variants={itemVariants}>
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.p 
                  key="loading"
                  className={cn(config.description, "mt-1")}
                  variants={loadingVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {loadingMessage || 'Loading...'}
                </motion.p>
              ) : (
                <motion.p 
                  key="description"
                  className={cn(config.description, "mt-1")}
                  variants={loadingVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {description}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
        <AnimatePresence>
          {actions && (
            <motion.div 
              className={cn(
                "flex items-center gap-2 mt-4 md:mt-0 md:ml-auto shrink-0",
                isMobile && "flex-wrap"
              )}
              variants={actionsVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {actions}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ 
        scale: isLoading ? 1 : 1.005,
        transition: { duration: 0.2 }
      }}
    >
      <Card 
        variant="glass" 
        depth="lg" 
        glow="subtle" 
        glowColor="auto" 
        className={cn(
          "glassmorphic mb-8 transition-all duration-300",
          !isLoading && "hover:shadow-2xl hover:shadow-primary/10",
          className
        )}
      >
        <CardContent className={cn(
          "w-full",
          config.padding,
          getVariantClasses(),
          config.gap
        )}>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {getSkeletonLayout()}
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                {getContentLayout()}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};
