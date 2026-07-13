'use client';

import { useState } from 'react';
import { Blurhash } from 'react-blurhash';

export default function BlurImage({
  src,
  blurHash,
  alt,
  className,
  onClick,
}: {
  src: string;
  blurHash?: string | null;
  alt: string;
  className?: string;
  onClick?: () => void;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`} onClick={onClick}>
      {!loaded && blurHash ? (
        <div className="absolute inset-0">
          <Blurhash hash={blurHash} width="100%" height="100%" resolutionX={32} resolutionY={32} punch={1} />
        </div>
      ) : !loaded ? (
        <div className="bs-skeleton absolute inset-0" />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
