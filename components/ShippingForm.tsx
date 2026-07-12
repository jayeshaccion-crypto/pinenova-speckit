"use client";

import { useState } from "react";

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
}

interface ShippingFormProps {
  value: ShippingAddress;
  onChange: (address: ShippingAddress) => void;
  errors: Partial<Record<keyof ShippingAddress, string>>;
}

const US_STATES = [
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" }, { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" }, { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" }, { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" }, { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" }, { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" }, { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" }, { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" }, { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" }, { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" }, { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" }, { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" }, { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" }, { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" }, { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" },
];

export function ShippingForm({ value, onChange, errors }: ShippingFormProps) {
  const [touched, setTouched] = useState<Partial<Record<keyof ShippingAddress, boolean>>>({});

  function handleBlur(field: keyof ShippingAddress) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function handleChange(field: keyof ShippingAddress, newVal: string) {
    onChange({ ...value, [field]: newVal });
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-foreground">Full Name</label>
        <input
          id="name"
          type="text"
          value={value.name}
          onChange={(e) => handleChange("name", e.target.value)}
          onBlur={() => handleBlur("name")}
          className={`input-field mt-1 w-full ${touched.name && errors.name ? "border-red-500" : ""}`}
          placeholder="John Doe"
        />
        {touched.name && errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="line1" className="block text-sm font-medium text-foreground">Address Line 1</label>
        <input
          id="line1"
          type="text"
          value={value.line1}
          onChange={(e) => handleChange("line1", e.target.value)}
          onBlur={() => handleBlur("line1")}
          className={`input-field mt-1 w-full ${touched.line1 && errors.line1 ? "border-red-500" : ""}`}
          placeholder="123 Main Street"
        />
        {touched.line1 && errors.line1 && <p className="mt-1 text-xs text-red-500">{errors.line1}</p>}
      </div>

      <div>
        <label htmlFor="line2" className="block text-sm font-medium text-foreground">Address Line 2 (Optional)</label>
        <input
          id="line2"
          type="text"
          value={value.line2 ?? ""}
          onChange={(e) => handleChange("line2", e.target.value)}
          className="input-field mt-1 w-full"
          placeholder="Apt 4B"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-foreground">City</label>
          <input
            id="city"
            type="text"
            value={value.city}
            onChange={(e) => handleChange("city", e.target.value)}
            onBlur={() => handleBlur("city")}
            className={`input-field mt-1 w-full ${touched.city && errors.city ? "border-red-500" : ""}`}
            placeholder="New York"
          />
          {touched.city && errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium text-foreground">State</label>
          <select
            id="state"
            value={value.state}
            onChange={(e) => handleChange("state", e.target.value)}
            onBlur={() => handleBlur("state")}
            className={`input-field mt-1 w-full ${touched.state && errors.state ? "border-red-500" : ""}`}
          >
            <option value="">Select state</option>
            {US_STATES.map((st) => (
              <option key={st.value} value={st.value}>{st.label}</option>
            ))}
          </select>
          {touched.state && errors.state && <p className="mt-1 text-xs text-red-500">{errors.state}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="zip" className="block text-sm font-medium text-foreground">ZIP Code</label>
        <input
          id="zip"
          type="text"
          value={value.zip}
          onChange={(e) => handleChange("zip", e.target.value)}
          onBlur={() => handleBlur("zip")}
          className={`input-field mt-1 w-full ${touched.zip && errors.zip ? "border-red-500" : ""}`}
          placeholder="10001"
          maxLength={10}
        />
        {touched.zip && errors.zip && <p className="mt-1 text-xs text-red-500">{errors.zip}</p>}
      </div>
    </div>
  );
}
