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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border bg-card/90 backdrop-blur-md shrink-0">
      <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground w-full sm:w-auto">
        <div className="w-40 shrink-0">
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

      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        <span className="text-xs font-bold text-muted-foreground mr-2">
          Halaman {currentPage} {totalPages ? `dari ${totalPages}` : ""}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl font-bold h-9 px-3 disabled:opacity-50 border-border bg-background"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={isPrevDisabled}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl font-bold h-9 px-3 disabled:opacity-50 border-border bg-background"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={isNextDisabled}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
