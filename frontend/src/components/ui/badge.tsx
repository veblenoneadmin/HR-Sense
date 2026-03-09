import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "destructive" | "warning" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        {
          "bg-blue-500/20 text-blue-300 border border-blue-500/30": variant === "default",
          "bg-white/10 text-gray-300 border border-white/10": variant === "secondary",
          "bg-green-500/20 text-green-300 border border-green-500/30": variant === "success",
          "bg-red-500/20 text-red-300 border border-red-500/30": variant === "destructive",
          "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30": variant === "warning",
          "border border-white/20 text-gray-400": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}
