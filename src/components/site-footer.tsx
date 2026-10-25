import Link from "next/link";
import { ArrowUpRight, Instagram } from "lucide-react";
import { Brand } from "@/components/brand";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand"><Brand inverse /></div>
        <div className="footer-links">
          <div>
            <span className="footer-label">Explore</span>
            <Link href="/menu">The menu</Link>
            <Link href="/about">Our story</Link>
            <Link href="/find-us">Find us</Link>
          </div>
          <div>
            <span className="footer-label">Contact</span>
            <a href="mailto:hello@goodkind.coffee">Email <ArrowUpRight size={13} /></a>
            <a href="https://www.instagram.com/" rel="noreferrer" target="_blank">Instagram <Instagram size={13} /></a>
            <a href="tel:+12125550184">+1 (212) 555-0184</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Goodkind Coffee Co.</span>
        <Link href="/admin">Admin</Link>
        <a href="#top">Back to top ↑</a>
      </div>
    </footer>
  );
}
