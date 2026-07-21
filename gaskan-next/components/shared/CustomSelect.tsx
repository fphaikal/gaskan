"use client";

import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

export interface CustomSelectOption {
  value: string;
  label: string;
}

export interface CustomSelectProps {
  options: CustomSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  icon?: string;
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Pilih opsi...",
  className,
  triggerClassName,
  disabled = false,
  icon,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full h-11 px-3.5 bg-card hover:bg-muted/50 border border-border rounded-2xl font-bold text-xs text-foreground flex items-center justify-between gap-2 transition-all shadow-xs outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed",
          triggerClassName
        )}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          {icon && <Icon icon={icon} className="text-muted-foreground text-sm shrink-0" />}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <Icon
          icon="mingcute:down-line"
          className={cn(
            "text-muted-foreground text-sm shrink-0 transition-transform duration-200",
            isOpen && "rotate-180 text-primary"
          )}
        />
      </button>

      {/* Floating Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 z-50 min-w-[160px] max-h-60 overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl p-1.5 animate-in fade-in-0 zoom-in-95 duration-150 custom-scrollbar">
          {options.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground font-semibold">
              Tidak ada pilihan
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between gap-2 transition-all cursor-pointer",
                    isSelected
                      ? "bg-primary/15 text-primary font-black"
                      : "text-foreground hover:bg-muted hover:text-primary"
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Icon icon="mingcute:check-fill" className="text-primary text-sm shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
