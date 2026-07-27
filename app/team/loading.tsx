import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeamLoading() {
  return (
    <div
      className="flex min-h-dvh flex-col bg-background text-foreground"
      aria-busy="true"
      aria-label="Memuat data tim GASKAN"
    >
      <LandingNavbar />

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-10 px-4 pb-12 pt-24 sm:space-y-12 sm:px-6 sm:pb-16">
        <div className="flex flex-col items-center space-y-3 text-center">
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-4 w-full max-w-sm" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <Skeleton className="h-10 w-10 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-3 w-full max-w-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 min-[380px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <Skeleton className="h-14 w-14 shrink-0" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-3 w-3/5" />
                  <Skeleton className="h-3 w-full" />
                </div>
                <div className="flex gap-2 border-t border-border pt-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <Skeleton className="h-9 w-9 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
