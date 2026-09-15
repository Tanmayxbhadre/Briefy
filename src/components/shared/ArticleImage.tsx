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
  fill,
  priority,
  sizes,
  src,
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

  // News sources use many different image CDNs. Render those URLs directly
  // instead of sending them through Next's restricted image optimizer.
  if (typeof src === 'string' && /^https?:\/\//i.test(src)) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        {...props}
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        sizes={sizes}
        onError={() => setFailed(true)}
        style={{
          ...props.style,
          ...(fill
            ? { position: 'absolute', inset: 0, width: '100%', height: '100%' }
            : {}),
        }}
      />
    );
  }

  return <Image {...props} src={src} fill={fill} priority={priority} sizes={sizes} alt={alt} onError={() => setFailed(true)} />;
}
