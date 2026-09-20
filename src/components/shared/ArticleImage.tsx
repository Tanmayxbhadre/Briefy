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

  return <Image {...props} src={src} fill={fill} priority={priority} sizes={sizes} alt={alt} onError={() => setFailed(true)} />;
}
