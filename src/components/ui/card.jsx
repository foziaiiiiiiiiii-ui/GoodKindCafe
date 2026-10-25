import { cn } from "../../lib/utils.js";

export function Card({ as: Component = "div", className, ...props }) {
  return <Component className={cn("border-0 bg-white", className)} {...props} />;
}
