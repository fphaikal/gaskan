import { Skeleton } from '@/components/ui/skeleton';

interface DataMasterSkeletonProps {
  actionCount?: number;
  maxWidth?: string;
}

export function DataMasterTablePageSkeleton({
  actionCount = 3,
  maxWidth = 'max-w-7xl',
}: DataMasterSkeletonProps) {
  return (
    <div
      className={`${maxWidth} mx-auto space-y-6 pb-12 animate-in fade-in duration-500`}
      aria-label="Memuat data"
      aria-busy="true"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: actionCount }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-28 rounded-2xl" />
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 bg-card p-4 rounded-3xl border border-border shadow-sm">
        <Skeleton className="h-11 flex-1 rounded-2xl" />
        <Skeleton className="h-11 w-full sm:w-48 rounded-2xl" />
        <Skeleton className="h-11 w-full sm:w-36 rounded-2xl" />
      </div>

      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="grid grid-cols-6 gap-4 p-4 border-b border-border bg-muted/20">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-3 w-full" />
          ))}
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 7 }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-6 gap-4 items-center p-4">
              <div className="flex items-center gap-3 col-span-2">
                <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-16 rounded-xl ml-auto" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <Skeleton className="h-8 w-32 rounded-xl" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-8 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

interface CardGridSkeletonProps extends DataMasterSkeletonProps {
  cardCount?: number;
  gridClassName?: string;
  showToolbar?: boolean;
  toolbarItems?: number;
}

export function DataMasterCardGridPageSkeleton({
  actionCount = 2,
  cardCount = 6,
  gridClassName = 'sm:grid-cols-2 lg:grid-cols-3',
  maxWidth = 'max-w-7xl',
  showToolbar = true,
  toolbarItems = 3,
}: CardGridSkeletonProps) {
  return (
    <div
      className={`${maxWidth} mx-auto space-y-6 pb-12 animate-in fade-in duration-500`}
      aria-label="Memuat data"
      aria-busy="true"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 max-w-full" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: actionCount }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-32 rounded-2xl" />
          ))}
        </div>
      </div>

      {showToolbar && (
        <div className="flex flex-col sm:flex-row gap-3 bg-card p-4 rounded-3xl border border-border shadow-sm">
          {Array.from({ length: toolbarItems }).map((_, index) => (
            <Skeleton
              key={index}
              className={`${index === 0 ? 'flex-1' : 'w-full sm:w-48'} h-11 rounded-2xl`}
            />
          ))}
        </div>
      )}

      <div className={`grid grid-cols-1 ${gridClassName} gap-4`}>
        {Array.from({ length: cardCount }).map((_, index) => (
          <div key={index} className="bg-card rounded-3xl p-5 border border-border shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
            <Skeleton className="h-6 w-2/3" />
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FieldPermissionsPageSkeleton() {
  return (
    <div
      className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500"
      aria-label="Memuat izin profil siswa"
      aria-busy="true"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 md:p-8 rounded-3xl border border-border shadow-sm">
        <div className="space-y-3 flex-1">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-9 w-full max-w-lg" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
        <Skeleton className="h-10 w-48 rounded-2xl" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 md:px-6 rounded-2xl border border-border">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-5 w-64 max-w-full" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="bg-card p-6 rounded-3xl border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
              <div className="flex items-center gap-2.5 flex-1">
                <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, optionIndex) => (
                <Skeleton key={optionIndex} className="h-14 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReshuffleTableRowsSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <tr key={index} className="border-b border-border last:border-b-0" aria-hidden="true">
          <td className="py-3 px-4"><Skeleton className="h-4 w-4 rounded" /></td>
          <td className="py-3 px-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
              <Skeleton className="h-4 w-36" />
            </div>
          </td>
          <td className="py-3 px-4"><Skeleton className="h-4 w-24 mx-auto" /></td>
          <td className="py-3 px-4"><Skeleton className="h-6 w-16 rounded-lg mx-auto" /></td>
          <td className="py-3 px-4"><Skeleton className="h-6 w-16 rounded-lg mx-auto" /></td>
        </tr>
      ))}
    </>
  );
}

export function ReshufflePageSkeleton() {
  return (
    <div
      className="space-y-6 pb-28 max-w-7xl mx-auto animate-in fade-in duration-500"
      aria-label="Memuat data reshuffle kelas"
      aria-busy="true"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-3xl border border-border shadow-sm">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-8 w-full max-w-md" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-4 bg-card p-5 rounded-3xl border border-border space-y-3">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-11 w-full rounded-2xl" />
        </div>
        <div className="md:col-span-8 bg-card p-5 rounded-3xl border border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-11 w-full rounded-2xl" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-9 w-64 rounded-xl" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {Array.from({ length: 5 }).map((_, index) => (
                  <th key={index} className="py-3 px-4"><Skeleton className="h-3 w-full" /></th>
                ))}
              </tr>
            </thead>
            <tbody><ReshuffleTableRowsSkeleton /></tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
