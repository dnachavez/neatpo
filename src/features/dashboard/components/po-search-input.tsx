"use client";

import { useCallback } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";

interface PoSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function PoSearchInput({ value, onChange }: PoSearchInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  return (
    <div className="relative">
      <MagnifyingGlass
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
      />
      <Input
        type="text"
        placeholder="Search by PO number or supplier name…"
        value={value}
        onChange={handleChange}
        className="pl-9"
      />
    </div>
  );
}
