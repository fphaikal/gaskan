import { Skeleton } from '@/components/ui/skeleton';

function PageHeaderSkeleton({ card = false, actions = 2 }: { card?: boolean; actions?: number }) {
  return (
    <div className={`flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between ${card ? 'bg-card p-4 sm:p-6 rounded-3xl border border-border shadow-sm' : ''}`}>
      <div className="min-w-0 space-y-2 flex-1">
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="flex w-full flex-wrap gap-2 md:w-auto">
        {Array.from({ length: actions }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-full rounded-2xl sm:w-32" />
        ))}
      </div>
    </div>
  );
}

function StatsSkeleton({ count, gridClassName }: { count: number; gridClassName: string }) {
  return (
    <div className={`grid ${gridClassName} gap-3`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="min-w-0 bg-card rounded-2xl p-3 sm:p-4 border border-border space-y-3">
          <Skeleton className="h-3 w-20 max-w-full" />
          <Skeleton className="h-7 w-12" />
        </div>
      ))}
    </div>
  );
}

export function AttendanceRecordsTableSkeleton() {
  return (
    <>
      <div className="divide-y divide-border md:hidden" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="space-y-3 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-3 w-6" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-11 w-28 rounded-xl" />
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
          {Array.from({ length: 7 }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              <td className="py-3 px-4"><Skeleton className="h-3 w-5" /></td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
                  <div className="min-w-32 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </td>
              <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
              <td className="py-3 px-4"><Skeleton className="h-6 w-20 rounded-lg" /></td>
              <td className="py-3 px-4"><Skeleton className="h-8 w-20" /></td>
              <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
              <td className="py-3 px-4"><Skeleton className="h-8 w-16 rounded-xl ml-auto" /></td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </>
  );
}

export function AttendancePageSkeleton() {
  return (
    <div className="space-y-4 pb-12 max-w-7xl mx-auto animate-in fade-in duration-500" aria-label="Memuat absensi kelas" aria-busy="true">
      <PageHeaderSkeleton actions={2} />
      <StatsSkeleton count={7} gridClassName="grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 sm:[&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1" />
      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        <AttendanceRecordsTableSkeleton />
        <div className="flex flex-col gap-3 p-4 border-t border-border min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
          <Skeleton className="h-8 w-full rounded-xl min-[360px]:w-32" />
          <div className="flex justify-between gap-2 min-[360px]:justify-start">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-11 rounded-xl sm:h-8 sm:w-8" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AcademicCalendarPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500" aria-label="Memuat kalender akademik" aria-busy="true">
      <div className="bg-card rounded-3xl p-4 sm:p-8 border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="min-w-0 space-y-3 flex-1">
          <Skeleton className="h-6 w-56 rounded-xl" />
          <Skeleton className="h-8 w-full max-w-lg" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <Skeleton className="h-11 w-full rounded-2xl sm:w-44" />
      </div>

      <StatsSkeleton count={5} gridClassName="grid-cols-2 sm:grid-cols-5" />

      <div className="bg-card rounded-3xl p-4 border border-border flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex min-w-0 flex-wrap gap-3 flex-1">
          <Skeleton className="h-11 w-full rounded-xl sm:h-9 sm:w-56" />
          <Skeleton className="h-11 w-full rounded-2xl sm:h-9 sm:w-60" />
        </div>
        <div className="flex w-full flex-wrap gap-2 lg:w-auto">
          <Skeleton className="h-11 w-full rounded-xl sm:h-9 sm:w-40" />
          <Skeleton className="h-11 w-full rounded-xl sm:h-9 sm:w-40" />
          <Skeleton className="h-11 w-full max-w-full rounded-2xl sm:h-9 sm:w-64" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="min-w-0 lg:col-span-8 bg-card rounded-3xl p-4 sm:p-6 border border-border shadow-sm">
          <div className="flex flex-col gap-3 pb-4 mb-4 border-b border-border min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
            <Skeleton className="h-6 w-40" />
            <div className="flex gap-2">
              <Skeleton className="h-11 w-11 rounded-xl sm:h-8 sm:w-8" />
              <Skeleton className="h-11 w-20 rounded-xl sm:h-8" />
              <Skeleton className="h-11 w-11 rounded-xl sm:h-8 sm:w-8" />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, index) => (
              <Skeleton key={index} className="h-12 sm:h-[72px] w-full rounded-xl sm:rounded-2xl" />
            ))}
          </div>
        </div>

        <div className="min-w-0 lg:col-span-4 bg-card rounded-3xl p-4 sm:p-6 border border-border shadow-sm space-y-4">
          <Skeleton className="h-6 w-44" />
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="p-4 rounded-2xl border border-border space-y-2">
              <div className="flex justify-between gap-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AttendanceLogPageSkeleton({ studentView = false }: { studentView?: boolean }) {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500" aria-label="Memuat log kehadiran" aria-busy="true">
      <PageHeaderSkeleton card actions={studentView ? 0 : 2} />
      {studentView ? (
        <div className="relative pl-8 space-y-6">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="relative bg-card rounded-3xl border border-border p-5 space-y-4">
              <Skeleton className="absolute -left-8 top-5 h-7 w-7 rounded-full" />
              <div className="flex min-w-0 justify-between gap-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, groupIndex) => (
            <div key={groupIndex} className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
              <div className="p-4 bg-muted/20 border-b border-border"><Skeleton className="h-4 w-56" /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="border border-border rounded-3xl p-4 flex gap-4 items-center">
                    <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-5 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function OnsiteTimelineSkeleton() {
  return (
    <div className="relative border-l-2 border-border ml-3 sm:ml-4 space-y-6" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="relative pl-6 sm:pl-8">
          <Skeleton className="absolute -left-[9px] top-4 h-4 w-4 rounded-full" />
          <div className="border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <Skeleton className="h-9 w-28 rounded-xl shrink-0" />
            <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56 max-w-full" />
            </div>
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function OnsitePageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500" aria-label="Memuat log on-site" aria-busy="true">
      <PageHeaderSkeleton actions={1} />
      <div className="bg-card border border-border rounded-3xl p-4 sm:p-8 shadow-sm">
        <OnsiteTimelineSkeleton />
      </div>
    </div>
  );
}

export function LeaveCardsSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="flex items-center gap-3 pt-2"><Skeleton className="h-5 w-44" /></div>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
          <Skeleton className="h-1.5 w-full rounded-none" />
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-xl" />
              <Skeleton className="h-6 w-24 rounded-xl" />
            </div>
            <Skeleton className="h-5 w-2/5" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            <div className="flex flex-col gap-3 pt-3 border-t border-border sm:flex-row sm:items-center sm:justify-between">
              <Skeleton className="h-4 w-40 max-w-full" />
              <Skeleton className="h-11 w-full rounded-xl sm:h-8 sm:w-28" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function LeavePageSkeleton({ showStats = false }: { showStats?: boolean }) {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500" aria-label="Memuat surat izin" aria-busy="true">
      <PageHeaderSkeleton actions={1} />
      {showStats && <StatsSkeleton count={4} gridClassName="grid-cols-2 md:grid-cols-4" />}
      <LeaveCardsSkeleton />
    </div>
  );
}

export function AttendanceReportPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500" aria-label="Memuat laporan absensi" aria-busy="true">
      <PageHeaderSkeleton card actions={0} />
      <div className="bg-card border border-border rounded-3xl p-4 sm:p-6 space-y-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-11 w-full rounded-2xl" />
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-end gap-3 sm:flex-row">
          <Skeleton className="h-11 w-full rounded-2xl sm:w-48" />
          <Skeleton className="h-11 w-full rounded-2xl sm:w-52" />
        </div>
      </div>
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-border space-y-2">
          <Skeleton className="h-4 w-72 max-w-full" />
          <Skeleton className="h-3 w-56 max-w-full" />
        </div>
        <Skeleton className="mx-4 h-3 w-64 max-w-[calc(100%-2rem)] sm:hidden" />
        <div className="max-w-full overflow-x-auto overscroll-x-contain">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-10 gap-3 p-4 bg-muted/30 border-b border-border">
              {Array.from({ length: 10 }).map((_, index) => <Skeleton key={index} className="h-3 w-full" />)}
            </div>
            {Array.from({ length: 7 }).map((_, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-10 gap-3 p-4 border-b border-border last:border-b-0">
                {Array.from({ length: 10 }).map((_, colIndex) => <Skeleton key={colIndex} className="h-5 w-full" />)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
