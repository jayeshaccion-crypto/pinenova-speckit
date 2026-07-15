"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface GalleryImage {
  id: string;
  url: string;
  altText: string | null;
}

export function ProductImageGallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const current = images[selectedIndex];

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!lightboxOpen) return;
    if (e.key === "Escape") { setLightboxOpen(false); return; }
    if (e.key === "ArrowLeft") { setSelectedIndex((i) => (i > 0 ? i - 1 : images.length - 1)); return; }
    if (e.key === "ArrowRight") { setSelectedIndex((i) => (i < images.length - 1 ? i + 1 : 0)); return; }
  }, [lightboxOpen, images.length]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => { document.body.style.overflow = ""; };
  }, [lightboxOpen]);

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
    <>
      <div className="space-y-4">
        <button
          onClick={() => setLightboxOpen(true)}
          className="aspect-square w-full overflow-hidden rounded-lg bg-primary/5 text-left"
          aria-label="Enlarge image"
        >
          <Image
            src={current.url}
            alt={current.altText ?? productName}
            width={600}
            height={600}
            className="h-full w-full object-cover"
            priority
          />
        </button>
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

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} image ${selectedIndex + 1} of ${images.length}`}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
            aria-label="Close lightbox"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedIndex((i) => (i > 0 ? i - 1 : images.length - 1)); }}
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
                aria-label="Previous image"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedIndex((i) => (i < images.length - 1 ? i + 1 : 0)); }}
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
                aria-label="Next image"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <div
            className="flex max-h-[90vh] max-w-[90vw] items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={current.url}
              alt={current.altText ?? productName}
              width={1200}
              height={1200}
              className="h-full w-full object-contain"
              sizes="90vw"
            />
          </div>

          <div className="absolute bottom-4 text-sm text-white/60">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}