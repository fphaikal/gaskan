"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { Icon } from '@/components/ui/icon';
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
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
    opensUp: boolean;
  }>({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 240,
    opensUp: false,
  });
  const [mounted, setMounted] = useState(false);
  const listboxId = useId();

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewport = window.visualViewport;
      const viewportTop = viewport?.offsetTop ?? 0;
      const viewportLeft = viewport?.offsetLeft ?? 0;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const viewportWidth = viewport?.width ?? document.documentElement.clientWidth;
      const viewportBottom = viewportTop + viewportHeight;
      const viewportRight = viewportLeft + viewportWidth;
      const margin = 8;
      const spaceBelow = viewportBottom - rect.bottom;
      const spaceAbove = rect.top - viewportTop;
      const opensUp = spaceBelow < 220 && spaceAbove > spaceBelow;
      const width = Math.min(rect.width, Math.max(0, viewportWidth - margin * 2));
      const left = Math.min(
        Math.max(rect.left, viewportLeft + margin),
        viewportRight - width - margin
      );
      const availableHeight = opensUp ? spaceAbove : spaceBelow;

      setCoords({
        top: opensUp ? rect.top - 6 : rect.bottom + 6,
        left,
        width,
        maxHeight: Math.max(80, Math.min(240, availableHeight - 12)),
        opensUp,
      });
    }
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updateCoords();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updateCoords();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    window.visualViewport?.addEventListener("resize", handleScrollOrResize);
    window.visualViewport?.addEventListener("scroll", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      window.visualViewport?.removeEventListener("resize", handleScrollOrResize);
      window.visualViewport?.removeEventListener("scroll", handleScrollOrResize);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          "w-full h-11 px-3.5 bg-card hover:bg-muted/50 border border-border rounded-2xl font-bold text-xs text-foreground flex items-center justify-between gap-2 transition-all shadow-xs outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
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

      {/* Floating Portal Dropdown Menu */}
      {isOpen &&
        mounted &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              maxHeight: `${coords.maxHeight}px`,
              transform: coords.opensUp ? "translateY(-100%)" : "none",
            }}
            id={listboxId}
            role="listbox"
            className="z-[99999] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-card p-1.5 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150 custom-scrollbar"
          >
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
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all sm:min-h-0",
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
          </div>,
          document.body
        )}
    </div>
  );
}
