'use client';

import React from 'react';

export default function SearchBar({ value, onChange, placeholder = 'Search products...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, width: '100%', maxWidth: 360 }}
    />
  );
}