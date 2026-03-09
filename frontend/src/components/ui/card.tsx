import { cn } from "@/lib/utils";

export function Card({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border shadow-sm", className)}
      style={{ backgroundColor: '#2d2d2d', borderColor: '#3c3c3c', ...style }}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1 p-6", className)} {...props} />;
}

export function CardTitle({ className, style, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base font-semibold", className)}
      style={{ color: '#e0e0e0', ...style }}
      {...props}
    />
  );
}

export function CardDescription({ className, style, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm", className)}
      style={{ color: '#858585', ...style }}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}
