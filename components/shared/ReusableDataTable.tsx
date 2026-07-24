"use client"

import * as React from "react"
import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type OnChangeFn,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type Table as TanStackTable,
  type TableOptions,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Inbox,
  Search,
} from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface MobileRowContext<TData> {
  row: Row<TData>
  table: TanStackTable<TData>
}

export interface ReusableDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  isLoading?: boolean
  pageSizeOptions?: number[]
  className?: string
  tableClassName?: string
  manualPagination?: boolean
  pageCount?: number
  pagination?: PaginationState
  onPaginationChange?: OnChangeFn<PaginationState>
  mobileColumnIds?: string[]
  mobileActionColumnId?: string
  mobileRowRenderer?: (context: MobileRowContext<TData>) => React.ReactNode
  stickyColumnId?: string
  actionColumnId?: string
  scrollHint?: string | false
  enableRowSelection?: boolean
  rowSelection?: RowSelectionState
  onRowSelectionChange?: OnChangeFn<RowSelectionState>
  getRowId?: TableOptions<TData>["getRowId"]
  emptyLabel?: string
}

function getColumnLabel<TData>(column: Column<TData, unknown>) {
  const header = column.columnDef.header
  return typeof header === "string" ? header : column.id
}

export function ReusableDataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  isLoading = false,
  pageSizeOptions = [10, 20, 30, 50],
  className,
  tableClassName,
  manualPagination,
  pageCount,
  pagination,
  onPaginationChange,
  mobileColumnIds,
  mobileActionColumnId,
  mobileRowRenderer,
  stickyColumnId,
  actionColumnId,
  scrollHint = "Geser tabel ke samping untuk melihat kolom lainnya.",
  enableRowSelection = false,
  rowSelection,
  onRowSelectionChange,
  getRowId,
  emptyLabel = "No results found.",
}: ReusableDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>({})
  const resolvedRowSelection = rowSelection ?? internalRowSelection
  const setResolvedRowSelection = onRowSelectionChange ?? setInternalRowSelection

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setResolvedRowSelection,
    enableRowSelection,
    getRowId,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection: resolvedRowSelection,
      ...(manualPagination && pagination ? { pagination } : {}),
    },
    manualPagination,
    pageCount,
    onPaginationChange,
  })

  const hasMobilePresentation = Boolean(mobileRowRenderer || mobileColumnIds?.length)
  const mobileRows = table.getRowModel().rows
  const sortableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanSort() && column.id !== mobileActionColumnId)
  const activeSort = table.getState().sorting[0]
  const activeSortValue = activeSort
    ? `${activeSort.id}:${activeSort.desc ? "desc" : "asc"}`
    : "none"

  const renderMobileRow = (row: Row<TData>) => {
    if (mobileRowRenderer) {
      return mobileRowRenderer({ row, table })
    }

    const visibleCells = row.getVisibleCells()
    const priorityCells = (mobileColumnIds || [])
      .map((columnId) => visibleCells.find((cell) => cell.column.id === columnId))
      .filter((cell): cell is NonNullable<typeof cell> => Boolean(cell))
    const actionCell = mobileActionColumnId
      ? visibleCells.find((cell) => cell.column.id === mobileActionColumnId)
      : undefined
    const [primaryCell, ...secondaryCells] = priorityCells

    return (
      <div className="min-w-0 flex-1 space-y-3">
        {primaryCell && (
          <div className="min-w-0 break-words font-semibold text-foreground">
            {flexRender(primaryCell.column.columnDef.cell, primaryCell.getContext())}
          </div>
        )}
        {secondaryCells.length > 0 && (
          <dl className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
            {secondaryCells.map((cell) => (
              <div key={cell.id} className="min-w-0">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {getColumnLabel(cell.column)}
                </dt>
                <dd className="mt-1 min-w-0 break-words text-sm">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {actionCell && (
          <div className="flex min-h-11 items-center justify-end border-t border-border pt-3">
            {flexRender(actionCell.column.columnDef.cell, actionCell.getContext())}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("min-w-0 space-y-4", className)}>
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {searchKey ? (
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="pl-9"
            />
          </div>
        ) : (
          <div />
        )}

        {hasMobilePresentation && sortableColumns.length > 0 && (
          <div className="w-full md:hidden">
            <Select
              value={activeSortValue}
              onValueChange={(value) => {
                if (!value || value === "none") {
                  table.resetSorting()
                  return
                }
                const [id, direction] = value.split(":")
                table.setSorting([{ id, desc: direction === "desc" }])
              }}
            >
              <SelectTrigger aria-label="Urutkan data" className="w-full">
                <SelectValue placeholder="Urutkan data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Urutan bawaan</SelectItem>
                {sortableColumns.flatMap((column) => [
                  <SelectItem key={`${column.id}:asc`} value={`${column.id}:asc`}>
                    {getColumnLabel(column)} — naik
                  </SelectItem>,
                  <SelectItem key={`${column.id}:desc`} value={`${column.id}:desc`}>
                    {getColumnLabel(column)} — turun
                  </SelectItem>,
                ])}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {hasMobilePresentation && (
        <div className="space-y-3 md:hidden">
          {enableRowSelection && !isLoading && mobileRows.length > 0 && (
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/20 p-3">
              <span className="text-xs font-medium text-muted-foreground">
                {table.getSelectedRowModel().rows.length} dipilih
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  table.toggleAllPageRowsSelected(!table.getIsAllPageRowsSelected())
                }
              >
                {table.getIsAllPageRowsSelected() ? "Batalkan semua" : "Pilih halaman"}
              </Button>
            </div>
          )}

          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="space-y-3 rounded-2xl border border-border bg-card p-4">
                <div className="h-5 w-2/3 animate-pulse rounded bg-muted/60" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-10 animate-pulse rounded bg-muted/60" />
                  <div className="h-10 animate-pulse rounded bg-muted/60" />
                </div>
                <div className="ml-auto h-11 w-24 animate-pulse rounded-xl bg-muted/60" />
              </div>
            ))
          ) : mobileRows.length > 0 ? (
            mobileRows.map((row) => (
              <div
                key={row.id}
                data-state={row.getIsSelected() ? "selected" : undefined}
                className="flex min-w-0 gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm data-[state=selected]:border-primary/40 data-[state=selected]:bg-primary/5"
              >
                {enableRowSelection && (
                  <input
                    type="checkbox"
                    aria-label={`Pilih baris ${row.index + 1}`}
                    checked={row.getIsSelected()}
                    disabled={!row.getCanSelect()}
                    onChange={row.getToggleSelectedHandler()}
                    className="mt-1 h-5 w-5 shrink-0 rounded border-border accent-primary"
                  />
                )}
                {renderMobileRow(row)}
              </div>
            ))
          ) : (
            <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-6 text-center text-muted-foreground">
              <Inbox className="h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm font-medium">{emptyLabel}</p>
            </div>
          )}
        </div>
      )}

      <div className={cn("min-w-0 rounded-2xl border bg-card", hasMobilePresentation && "hidden md:block")}>
        <Table className={cn("min-w-[720px]", tableClassName)} scrollHint={scrollHint}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isStickyIdentity = header.column.id === stickyColumnId
                  const isStickyAction = header.column.id === actionColumnId
                  const sorted = header.column.getIsSorted()

                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        isStickyIdentity && "sticky left-0 z-20 bg-card shadow-[4px_0_8px_-6px_rgb(0_0_0/0.35)]",
                        isStickyAction && "sticky right-0 z-20 bg-card shadow-[-4px_0_8px_-6px_rgb(0_0_0/0.35)]"
                      )}
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex min-h-11 items-center gap-2 text-left font-medium"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : sorted === "desc" ? (
                            <ArrowDown className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-row-${index}`}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={`skeleton-cell-${index}-${colIndex}`}>
                      <div className="h-5 w-full animate-pulse rounded bg-muted/60" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        cell.column.id === stickyColumnId &&
                          "sticky left-0 z-10 bg-card shadow-[4px_0_8px_-6px_rgb(0_0_0/0.35)]",
                        cell.column.id === actionColumnId &&
                          "sticky right-0 z-10 bg-card shadow-[-4px_0_8px_-6px_rgb(0_0_0/0.35)]"
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Inbox className="h-8 w-8 text-muted-foreground/60" />
                    <p className="text-sm font-medium">{emptyLabel}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex min-w-0 flex-col gap-4 px-1 sm:flex-row sm:items-center sm:justify-between sm:px-2">
        <div className="flex w-full items-center justify-between gap-2 text-sm text-muted-foreground sm:w-auto sm:justify-start">
          <span>Rows per page</span>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger aria-label="Baris per halaman" className="w-20">
              <SelectValue placeholder={`${table.getState().pagination.pageSize}`} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-0 items-center justify-between gap-2 min-[360px]:gap-4">
          <div className="min-w-0 text-sm font-medium text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              title="First Page"
              aria-label="Halaman pertama"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              title="Previous Page"
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              title="Next Page"
              aria-label="Halaman berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.setPageIndex(Math.max(0, table.getPageCount() - 1))}
              disabled={!table.getCanNextPage()}
              title="Last Page"
              aria-label="Halaman terakhir"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
