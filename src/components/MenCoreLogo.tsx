import React from 'react';
import mencoreLogoImg from '../assets/mencore-logo.jpg';

interface MenCoreAvatarProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const MenCoreAvatar: React.FC<MenCoreAvatarProps> = ({
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className={`relative flex items-center justify-center shrink-0 rounded-full overflow-hidden border border-cyan-500/30 shadow-md ${sizeClasses[size]} ${className}`}>
      <img
        src={mencoreLogoImg}
        alt="MenCore AI Logo"
        className="w-full h-full object-cover"
        onError={(e) => {
          // Fallback if image load fails
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    </div>
  );
};

interface MenCoreFullLogoProps {
  className?: string;
  showSubtitle?: boolean;
}

export const MenCoreFullLogo: React.FC<MenCoreFullLogoProps> = ({
  className = '',
  showSubtitle = true,
}) => {
  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <img
        src={mencoreLogoImg}
        alt="Smart MenCore - Powered by Menmex"
        className="h-16 md:h-20 object-contain drop-shadow-lg"
      />
      {showSubtitle && (
        <span className="text-[10px] uppercase font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 mt-1">
          Powered by Menmex
        </span>
      )}
    </div>
  );
};
