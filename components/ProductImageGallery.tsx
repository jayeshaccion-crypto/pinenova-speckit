"use client";

import { useState } from "react";
import Image from "next/image";

interface GalleryImage {
  id: string;
  url: string;
  altText: string | null;
}

export function ProductImageGallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const current = images[selectedIndex];

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-primary/5 text-foreground/30">
        <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="aspect-square overflow-hidden rounded-lg bg-primary/5">
        <Image
          src={current.url}
          alt={current.altText ?? productName}
          width={600}
          height={600}
          className="h-full w-full object-cover"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Product images">
          {images.map((img, i) => (
            <button
              key={img.id}
              role="tab"
              aria-selected={i === selectedIndex}
              aria-label={`View image ${i + 1}`}
              onClick={() => setSelectedIndex(i)}
              className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                i === selectedIndex ? "border-primary" : "border-transparent hover:border-primary/50"
              }`}
            >
              <Image
                src={img.url}
                alt={img.altText ?? `${productName} thumbnail ${i + 1}`}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
