"use client";

import { useState } from "react";

interface CartDiscountCodeProps {
  code: string;
  onChange: (code: string) => void;
}

export function CartDiscountCode({ code, onChange }: CartDiscountCodeProps) {
  const [input, setInput] = useState(code);
  const [error, setError] = useState("");

  function handleApply() {
    const trimmed = input.trim().toUpperCase();
    if (!trimmed) {
      setError("Enter a discount code");
      return;
    }
    if (!/^[A-Z0-9_]+$/.test(trimmed)) {
      setError("Invalid code format");
      return;
    }
    setError("");
    onChange(trimmed);
  }

  function handleRemove() {
    setInput("");
    setError("");
    onChange("");
  }

  return (
    <div className="card p-4">
      <h3 className="mb-2 text-sm font-semibold text-foreground">Discount Code</h3>
      {code ? (
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-green-700">{code}</span>
          </div>
          <button
            onClick={handleRemove}
            className="text-sm text-red-500 hover:text-red-700 transition-colors"
            aria-label="Remove discount code"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value.toUpperCase()); setError(""); }}
            placeholder="SAVE10"
            className="input-field flex-1 text-sm"
            maxLength={20}
            onKeyDown={(e) => { if (e.key === "Enter") handleApply(); }}
          />
          <button
            type="button"
            onClick={handleApply}
            className="btn-primary shrink-0 px-3 py-2 text-sm"
          >
            Apply
          </button>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <p className="mt-1 text-xs text-foreground/50">Code applied at checkout</p>
    </div>
  );
}
