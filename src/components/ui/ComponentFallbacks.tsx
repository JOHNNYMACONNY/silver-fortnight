import React from "react";
import { cn } from "../../utils/cn";

// Fallback Button Component
export const FallbackButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: string;
  size?: string;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}> = ({
  children,
  onClick,
  variant = "default",
  size = "md",
  className = "",
  disabled = false,
  type = "button",
}) => {
  const variantClasses = {
    default: "bg-primary hover:bg-primary/90 text-primary-foreground",
    secondary:
      "bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100",
    outline:
      "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800",
    ghost:
      "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
    destructive: "bg-red-500 hover:bg-red-600 text-white",
  };

  const sizeClasses = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
    xl: "h-14 px-8 text-lg",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant as keyof typeof variantClasses] ||
          variantClasses.default,
        sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.md,
        className
      )}
    >
      {children}
    </button>
  );
};

// Fallback Card Component - Enhanced with Glassmorphism
export const FallbackCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "glass" | "elevated";
}> = ({ children, className = "", variant = "default" }) => {
  const variantClasses = {
    default: "glassmorphic",
    glass: "glassmorphic",
    elevated: "glassmorphic shadow-xl",
  };

  return (
    <div
      className={cn(
        "transition-all duration-300",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </div>
  );
};

export const FallbackCardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)}>
    {children}
  </div>
);

export const FallbackCardTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <h3
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
  >
    {children}
  </h3>
);

export const FallbackCardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={cn("p-6 pt-0", className)}>{children}</div>
);

export const FallbackCardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={cn("flex items-center p-6 pt-0", className)}>{children}</div>
);

// Fallback Badge Component - Enhanced with Glassmorphism
export const FallbackBadge: React.FC<{
  children: React.ReactNode;
  variant?: string;
  className?: string;
}> = ({ children, variant = "default", className = "" }) => {
  const variantClasses = {
    default:
      "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border-standard",
    secondary:
      "bg-gray-100/80 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300 border-standard",
    destructive:
      "bg-red-100/80 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-standard",
    outline:
      "bg-white/50 dark:bg-neutral-800/50 border-standard text-gray-900 dark:text-gray-100",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all duration-200",
        variantClasses[variant as keyof typeof variantClasses] ||
          variantClasses.default,
        className
      )}
    >
      {children}
    </span>
  );
};

// Fallback Avatar Component - Enhanced with Glassmorphism
export const FallbackAvatar: React.FC<{
  src?: string;
  alt: string;
  size?: string;
  className?: string;
}> = ({ src, alt, size = "md", className = "" }) => {
  const sizeClasses = {
    xs: "h-6 w-6 text-xs",
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-12 w-12 text-lg",
    xl: "h-16 w-16 text-xl",
  };

  const [imgError, setImgError] = React.useState(false);

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden flex items-center justify-center bg-muted/60 border border-border",
        sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.md,
        className
      )}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="font-medium text-gray-600 dark:text-gray-400">
          {alt.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
};

// Fallback Modal Component - Enhanced with Glassmorphism
export const FallbackModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: string;
}> = ({ isOpen, onClose, title, children, size = "md" }) => {
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-full",
  };

  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-navigation flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className={cn(
          "glassmorphic w-full transition-all duration-300",
          sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.md
        )}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// Fallback Logo Component - Enhanced with Glassmorphism
export const FallbackLogo: React.FC<{
  size?: string;
  showText?: boolean;
  className?: string;
}> = ({ size = "medium", showText = true, className = "" }) => {
  const sizeClasses = {
    small: "h-6 w-6",
    medium: "h-8 w-8",
    large: "h-12 w-12",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "bg-primary/90 rounded-lg flex items-center justify-center",
          sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.medium
        )}
      >
        <span className="text-white font-bold text-sm">T</span>
      </div>
      {showText && (
        <span className="font-bold text-xl text-gray-900 dark:text-white">
          TradeYa.io
        </span>
      )}
    </div>
  );
};

// Component Fallback Mapper
export const ComponentFallbacks = {
  Button: FallbackButton,
  Card: FallbackCard,
  CardHeader: FallbackCardHeader,
  CardTitle: FallbackCardTitle,
  CardContent: FallbackCardContent,
  CardFooter: FallbackCardFooter,
  Badge: FallbackBadge,
  Avatar: FallbackAvatar,
  Modal: FallbackModal,
  Logo: FallbackLogo,
};

export default ComponentFallbacks;
