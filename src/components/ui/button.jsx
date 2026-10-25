import { cn } from "../../lib/utils.js";

const variants = {
  default: "border-black bg-black text-white hover:bg-white hover:text-black",
  outline: "border-black bg-white text-black hover:bg-black hover:text-white",
};

export function Button({
  as: Component = "button",
  className,
  variant = "default",
  ...props
}) {
  return (
    <Component
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-3 border px-5 py-3 text-xs font-bold uppercase transition-colors",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
