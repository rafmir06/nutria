import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
  height?: string;
}

export function SkeletonCard({ className, height = "h-32" }: SkeletonCardProps) {
  return (
    <div className={cn("skeleton rounded-3xl", height, className)} />
  );
}

export function SkeletonText({ className }: { className?: string }) {
  return <div className={cn("skeleton h-4 rounded-lg", className)} />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 p-5">
      <SkeletonCard height="h-14" className="w-1/2" />
      <SkeletonCard height="h-64" />
      <div className="grid grid-cols-3 gap-3">
        <SkeletonCard height="h-24" />
        <SkeletonCard height="h-24" />
        <SkeletonCard height="h-24" />
      </div>
      <SkeletonCard height="h-48" />
    </div>
  );
}
