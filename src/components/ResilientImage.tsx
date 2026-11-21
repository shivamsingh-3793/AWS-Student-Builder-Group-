import { useState } from 'react';
import { Cloud } from 'lucide-react';
import { resolveMediaUrl } from '../lib/api';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function ResilientImage({ src, alt, className = '', fallbackTitle }: ResilientImageProps) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveMediaUrl(src);

  if (!resolved || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#151B24] blueprint-grid text-[#00E582] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Cloud className="w-8 h-8 mb-2 opacity-80" />
        <span className="text-xs font-mono tracking-wider uppercase text-slate-300 max-w-[220px] truncate">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
