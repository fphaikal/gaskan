import { Skeleton } from '@/components/ui/skeleton';

function SystemHeaderSkeleton({ controls = 1 }: { controls?: number }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card p-6 rounded-3xl border border-border shadow-sm">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-8 w-80 max-w-full" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: controls }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-36 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function SystemLogTableSkeleton() {
  return (
    <div className="overflow-x-auto" aria-hidden="true">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-muted/30 border-b border-border">
            {Array.from({ length: 7 }).map((_, index) => (
              <th key={index} className="py-4 px-4"><Skeleton className="h-3 w-full" /></th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {Array.from({ length: 8 }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              <td className="py-4 px-4"><Skeleton className="h-3 w-5" /></td>
              <td className="py-4 px-4"><Skeleton className="h-4 w-32" /></td>
              <td className="py-4 px-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
              <td className="py-4 px-4"><Skeleton className="h-4 w-24" /></td>
              <td className="py-4 px-4"><Skeleton className="h-4 w-36" /></td>
              <td className="py-4 px-4"><Skeleton className="h-4 w-28" /></td>
              <td className="py-4 px-4"><Skeleton className="h-8 w-8 rounded-xl ml-auto" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SystemLogPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500" aria-label="Memuat log sistem" aria-busy="true">
      <SystemHeaderSkeleton controls={3} />
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <SystemLogTableSkeleton />
      </div>
    </div>
  );
}

export function FileExplorerGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4" aria-hidden="true">
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="bg-card border border-border rounded-3xl p-3 space-y-3 shadow-sm">
          <Skeleton className="w-full aspect-square rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-3 w-10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FileExplorerPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500" aria-label="Membaca direktori server" aria-busy="true">
      <SystemHeaderSkeleton />
      <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-3xl border border-border shadow-sm">
        <Skeleton className="h-10 flex-1 max-w-sm rounded-xl" />
        <div className="flex flex-wrap gap-3 md:ml-auto">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-44 rounded-xl" />
          <Skeleton className="h-10 w-44 rounded-xl" />
        </div>
      </div>
      <FileExplorerGridSkeleton />
      <div className="flex items-center justify-between px-2">
        <Skeleton className="h-8 w-32 rounded-xl" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-8 w-8 rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}

export function DeviceCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
          <div className="space-y-3 pt-4 border-t border-border">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex gap-2 pt-3 border-t border-border">
            <Skeleton className="h-9 flex-1 rounded-xl" />
            <Skeleton className="h-9 flex-1 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DeviceConfigPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500" aria-label="Memuat konfigurasi mesin" aria-busy="true">
      <SystemHeaderSkeleton />
      <DeviceCardsSkeleton />
    </div>
  );
}

export function SystemMetricsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-card border border-border rounded-3xl p-5 space-y-3 shadow-sm">
          <div className="flex justify-between"><Skeleton className="h-3 w-24" /><Skeleton className="h-6 w-6 rounded-lg" /></div>
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

export function SystemManagePageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500" aria-label="Memuat metrik sistem" aria-busy="true">
      <SystemHeaderSkeleton />
      <SystemMetricsCardsSkeleton />
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex justify-between gap-4 pb-4 border-b border-border">
          <div className="space-y-2 flex-1"><Skeleton className="h-6 w-56" /><Skeleton className="h-4 w-96 max-w-full" /></div>
          <Skeleton className="h-10 w-32 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-3xl border border-border p-5 space-y-4">
              <div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-xl" /><Skeleton className="h-5 w-40" /></div>
              {Array.from({ length: 4 }).map((_, fieldIndex) => <Skeleton key={fieldIndex} className="h-11 w-full rounded-2xl" />)}
              <Skeleton className="h-10 w-36 rounded-2xl ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ErrorLogCardsSkeleton() {
  return (
    <div className="space-y-8" aria-hidden="true">
      {Array.from({ length: 2 }).map((_, groupIndex) => (
        <div key={groupIndex} className="space-y-4">
          <div className="flex items-center gap-3 py-3 border-b border-border">
            <Skeleton className="h-6 w-1.5 rounded-full" />
            <Skeleton className="h-6 w-56" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-card border border-border rounded-3xl p-5 space-y-4 shadow-sm">
                <div className="flex gap-4">
                  <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
                  <div className="space-y-2 flex-1"><Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-1/2" /></div>
                </div>
                <Skeleton className="w-full h-32 rounded-2xl" />
                <div className="flex justify-between pt-3 border-t border-border">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorLogPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500" aria-label="Memuat log error" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <ErrorLogCardsSkeleton />
    </div>
  );
}
