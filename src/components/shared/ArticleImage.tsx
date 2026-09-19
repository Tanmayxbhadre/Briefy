'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

import BrandedPlaceholder from './BrandedPlaceholder';

interface ArticleImageProps extends Omit<ImageProps, 'alt' | 'src'> {
  src?: string | null;
  alt: string;
  fallbackLabel?: string;
  category?: string;
}

export default function ArticleImage({
  alt,
  fallbackLabel,
  category,
  fill,
  priority,
  sizes,
  src,
  ...props
}: ArticleImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    const cleanLabel =
      alt && alt.trim().length > 0 && alt !== 'Briefy.live'
        ? alt
        : fallbackLabel || (category ? `${category} - Briefy.live News` : 'Briefy.live News Coverage');

    return (
      <BrandedPlaceholder
        label={cleanLabel}
        category={category}
        className={props.className}
      />
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
