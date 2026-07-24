import { Skeleton } from '@/components/ui/skeleton';

function SystemHeaderSkeleton({ controls = 1 }: { controls?: number }) {
  return (
    <div className="flex min-w-0 flex-col gap-4 bg-card p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between rounded-3xl border border-border shadow-sm">
      <div className="min-w-0 space-y-2 flex-1">
        <Skeleton className="h-8 w-80 max-w-full" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="flex w-full flex-wrap gap-2 lg:w-auto">
        {Array.from({ length: controls }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-full rounded-2xl sm:w-36" />
        ))}
      </div>
    </div>
  );
}

export function SystemLogTableSkeleton() {
  return (
    <>
      <div className="divide-y divide-border md:hidden" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-3 p-4">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <div className="flex justify-between border-t border-border pt-3">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
      <div className="hidden max-w-full overflow-x-auto md:block" aria-hidden="true">
        <table className="min-w-[720px] w-full text-xs border-collapse">
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
    </>
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
      <div className="flex min-w-0 flex-col gap-4 bg-card p-4 rounded-3xl border border-border shadow-sm md:flex-row">
        <Skeleton className="h-11 w-full flex-1 rounded-xl md:max-w-sm" />
        <div className="flex w-full flex-wrap gap-3 md:ml-auto md:w-auto">
          <Skeleton className="h-11 w-full rounded-xl sm:w-36" />
          <Skeleton className="h-11 w-full rounded-xl sm:w-44" />
          <Skeleton className="h-11 w-full rounded-xl sm:w-44" />
        </div>
      </div>
      <FileExplorerGridSkeleton />
      <div className="flex flex-col gap-3 px-2 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
        <Skeleton className="h-8 w-full rounded-xl min-[360px]:w-32" />
        <div className="flex justify-between gap-2 min-[360px]:justify-start">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-11 w-11 rounded-xl sm:h-8 sm:w-8" />)}
        </div>
      </div>
    </div>
  );
}

export function DeviceCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="min-w-0 bg-card border border-border rounded-3xl p-4 sm:p-6 shadow-sm space-y-5">
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
            <Skeleton className="h-11 flex-1 rounded-xl sm:h-9" />
            <Skeleton className="h-11 flex-1 rounded-xl sm:h-9" />
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
        <div className="flex flex-col gap-4 pb-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-2 flex-1"><Skeleton className="h-6 w-56 max-w-full" /><Skeleton className="h-4 w-96 max-w-full" /></div>
          <Skeleton className="h-11 w-full rounded-2xl sm:h-10 sm:w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="min-w-0 rounded-3xl border border-border p-4 sm:p-5 space-y-4">
              <div className="flex min-w-0 items-center gap-3"><Skeleton className="h-10 w-10 shrink-0 rounded-xl" /><Skeleton className="h-5 w-40 max-w-full" /></div>
              {Array.from({ length: 4 }).map((_, fieldIndex) => <Skeleton key={fieldIndex} className="h-11 w-full rounded-2xl" />)}
              <Skeleton className="h-11 w-full rounded-2xl sm:ml-auto sm:h-10 sm:w-36" />
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
          <div className="flex min-w-0 items-center gap-3 py-3 border-b border-border">
            <Skeleton className="h-6 w-1.5 rounded-full" />
            <Skeleton className="h-6 w-56 max-w-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="min-w-0 bg-card border border-border rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm">
                <div className="flex min-w-0 gap-4">
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
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <ErrorLogCardsSkeleton />
    </div>
  );
}
