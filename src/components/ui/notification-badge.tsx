import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  className?: string;
  showZero?: boolean;
}

export const NotificationBadge = ({ 
  count, 
  className,
  showZero = false 
}: NotificationBadgeProps) => {
  if (count === 0 && !showZero) return null;

  const displayCount = count > 99 ? "99+" : count.toString();

  return (
    <div
      className={cn(
        "absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-[10px] font-bold leading-none z-10 border-2 border-background",
        className
      )}
    >
      {displayCount}
    </div>
  );
};