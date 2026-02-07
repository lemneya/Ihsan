import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-muted animate-pulse",
        className
      )}
    />
  );
}

export function ChatSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* User message skeleton */}
      <div className="flex justify-end">
        <div className="flex items-start gap-3">
          <Skeleton className="h-12 w-48 rounded-2xl rounded-tr-sm" />
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        </div>
      </div>
      {/* Assistant message skeleton */}
      <div className="flex items-start gap-3">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}

export function ToolGridSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 max-w-3xl mx-auto">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <Skeleton className="h-3 w-14" />
        </div>
      ))}
    </div>
  );
}
