
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 44" // Adjusted viewBox for the text
      className={cn("w-auto h-10", className)}
      // Set a fixed height and auto width to maintain aspect ratio
    >
      <text 
        id="logo-text"
        x="50%" 
        y="50%" 
        dominantBaseline="central" 
        textAnchor="middle" 
        fontSize="24" 
        fontWeight="bold"
        fill="#ED1C24"
      >
        upGrad
      </text>
    </svg>
  );
}
