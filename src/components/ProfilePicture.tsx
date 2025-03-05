import { User } from 'lucide-react';

interface ProfilePictureProps {
  url?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function ProfilePicture({ url, size = 'md', className = '' }: ProfilePictureProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };

  if (!url) {
    return (
      <div 
        className={`
          ${sizeClasses[size]} 
          rounded-full bg-cyber-gray-800 border border-cyber-gray-700
          flex items-center justify-center
          relative overflow-hidden
          ${className}
        `}
      >
        <div className="absolute inset-0 bg-mesh opacity-30"></div>
        <div className="absolute inset-0 bg-noise opacity-50"></div>
        <User className={`
          ${size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-6 w-6' : 'h-8 w-8'} 
          text-cyber-gray-400 relative z-10
        `} />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} relative group ${className}`}>
      <img
        src={url}
        alt="Profile"
        className={`
          w-full h-full object-cover rounded-full
          border-2 border-cyber-gray-900
          transition-all duration-300
        `}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent('User')}&background=1A1A1A&color=5BC0EB`;
        }}
      />
      <div className="absolute inset-0 bg-noise opacity-10 rounded-full pointer-events-none"></div>
    </div>
  );
}