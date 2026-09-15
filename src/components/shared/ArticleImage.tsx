'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface ArticleImageProps extends Omit<ImageProps, 'alt'> {
  alt: string;
  fallbackLabel?: string;
}

export default function ArticleImage({
  alt,
  fallbackLabel = 'Briefy news',
  ...props
}: ArticleImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          background: 'linear-gradient(135deg, #e8edf8, #f5f5f2)',
          color: '#1a3a8b',
          fontFamily: 'var(--font-sans)',
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textAlign: 'center',
          textTransform: 'uppercase',
        }}
      >
        {fallbackLabel}
      </div>
    );
  }

  return <Image {...props} alt={alt} onError={() => setFailed(true)} />;
}
