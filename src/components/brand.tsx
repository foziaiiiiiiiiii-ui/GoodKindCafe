import Link from "next/link";
import { Coffee } from "lucide-react";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link className={`brand${inverse ? " brand-inverse" : ""}`} href="/" aria-label="Goodkind home">
      <span className="brand-mark"><Coffee size={20} strokeWidth={1.8} /></span>
      <span>goodkind<span className="brand-period">.</span></span>
    </Link>
  );
}
