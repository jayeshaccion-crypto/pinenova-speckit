"use client";

export function VariantSelector() {
  return (
    <div className="space-y-4 border-t border-primary/10 pt-6">
      <div className="rounded-lg border border-dashed border-primary/20 bg-primary/[0.02] p-4 text-center">
        <p className="text-sm font-medium text-foreground/60">Variants coming soon</p>
        <p className="mt-1 text-xs text-foreground/40">Size and color options will be available in a future update.</p>
      </div>

      <div className="pointer-events-none opacity-40">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">Size</h3>
          <div className="flex flex-wrap gap-2">
            {["XS", "S", "M", "L", "XL"].map((size) => (
              <span key={size} className="min-w-[48px] rounded-lg border border-primary/20 px-3 py-2 text-center text-sm text-foreground/50">
                {size}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <h3 className="mb-2 text-sm font-semibold text-foreground">Color</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { name: "Natural", hex: "#F5E6D0" },
              { name: "Olive", hex: "#8A9A5B" },
              { name: "Charcoal", hex: "#36454F" },
            ].map((color) => (
              <span key={color.name} className="flex items-center gap-2 rounded-lg border border-primary/20 px-3 py-2 text-sm text-foreground/50">
                <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: color.hex }} />
                {color.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}