"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationControlsProps {
  currentPage: number;
  totalPages?: number;
  totalItems?: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  isLoading?: boolean;
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onLimitChange,
  isLoading = false,
}: PaginationControlsProps) {
  const isNextDisabled = isLoading || (totalPages ? currentPage >= totalPages : false);
  const isPrevDisabled = isLoading || currentPage <= 1;

  const limitOptions = [
    { value: "10", label: "10 / Halaman" },
    { value: "20", label: "20 / Halaman" },
    { value: "30", label: "30 / Halaman" },
    { value: "50", label: "50 / Halaman" },
    { value: "100", label: "100 / Halaman" },
  ];

  return (
    <div className="flex shrink-0 flex-col items-center justify-between gap-3 border-t border-border bg-card/90 p-3 backdrop-blur-md sm:flex-row sm:gap-4 sm:p-4">
      <div className="flex w-full items-center justify-between gap-3 text-xs font-bold text-muted-foreground sm:w-auto sm:justify-start sm:gap-4">
        <div className="w-40 max-w-full shrink-0">
          <CustomSelect
            value={String(itemsPerPage)}
            onChange={(val) => {
              onLimitChange(Number(val));
              // Reset page to 1 when limit changes is usually a good idea, but can be handled upstream.
            }}
            options={limitOptions}
            placeholder="Pilih Limit"
          />
        </div>
        {totalItems !== undefined && (
          <span className="hidden sm:inline-block whitespace-nowrap">Total: {totalItems} Data</span>
        )}
      </div>

      <div className="flex w-full min-w-0 items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-3">
        <span className="min-w-0 truncate whitespace-nowrap text-[11px] font-bold text-muted-foreground sm:mr-2 sm:text-xs">
          Halaman {currentPage} {totalPages ? `dari ${totalPages}` : ""}
        </span>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-11 min-w-11 rounded-xl border-border bg-background px-0 font-bold disabled:opacity-50 min-[360px]:px-3 sm:h-9"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={isPrevDisabled}
            aria-label="Halaman sebelumnya"
            title="Halaman sebelumnya"
          >
            <ChevronLeft className="h-4 w-4 min-[360px]:mr-1" />
            <span className="hidden min-[360px]:inline">Prev</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-11 min-w-11 rounded-xl border-border bg-background px-0 font-bold disabled:opacity-50 min-[360px]:px-3 sm:h-9"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={isNextDisabled}
            aria-label="Halaman berikutnya"
            title="Halaman berikutnya"
          >
            <span className="hidden min-[360px]:inline">Next</span>
            <ChevronRight className="h-4 w-4 min-[360px]:ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
