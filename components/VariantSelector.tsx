"use client";

import { useState } from "react";

const SIZES = ["XS", "S", "M", "L", "XL"];
const COLORS = [
  { name: "Natural", hex: "#F5E6D0" },
  { name: "Olive", hex: "#8A9A5B" },
  { name: "Charcoal", hex: "#36454F" },
];

export function VariantSelector() {
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  return (
    <div className="space-y-4 border-t border-primary/10 pt-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">
          Size
          {selectedSize && <span className="ml-2 text-foreground/50 font-normal">{selectedSize}</span>}
        </h3>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`min-w-[48px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                selectedSize === size
                  ? "border-primary bg-primary text-white"
                  : "border-primary/20 text-foreground/70 hover:border-primary/50"
              }`}
              aria-pressed={selectedSize === size}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">
          Color
          {selectedColor && <span className="ml-2 text-foreground/50 font-normal">{selectedColor}</span>}
        </h3>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((color) => (
            <button
              key={color.name}
              onClick={() => setSelectedColor(color.name)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                selectedColor === color.name
                  ? "border-primary"
                  : "border-primary/20 hover:border-primary/50"
              }`}
              aria-pressed={selectedColor === color.name}
            >
              <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: color.hex }} />
              {color.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
