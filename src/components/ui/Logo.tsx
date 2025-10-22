import React from "react";
import { Link } from "react-router-dom";

interface LogoProps {
  size?: "small" | "medium" | "large";
  showText?: boolean;
  className?: string;
  linkTo?: string | null;
  alt?: string;
}

const Logo: React.FC<LogoProps> = ({
  size = "medium",
  showText = true,
  className = "",
  linkTo = "/",
  alt = "TradeYa Logo",
}) => {
  const sizeClasses = {
    small: "h-8 w-auto",
    medium: "h-10 w-auto",
    large: "h-16 w-auto",
  };

  const textSizeClasses = {
    small: "text-lg",
    medium: "text-2xl",
    large: "text-3xl",
  };

  const logoElement = (
    <div className={`flex items-center space-x-3 ${className}`}>
      <img
        src="/images/optimized/tradeya-logo.png"
        alt={alt}
        className={`${sizeClasses[size]} transition-transform duration-200 hover:scale-105`}
      />
      {showText && (
        <span
          className={`font-bold text-primary hover:text-primary/80 transition-colors duration-200 ${textSizeClasses[size]}`}
        >
          TradeYa.io
        </span>
      )}
    </div>
  );

  if (linkTo !== null && linkTo !== undefined) {
    return (
      <Link to={linkTo} className="flex-shrink-0">
        {logoElement}
      </Link>
    );
  }

  return logoElement;
};

export default Logo;
