"use client";

import Link from "next/link";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { Brand } from "@/components/brand";
import { useCafe } from "@/components/cafe-provider";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { cart, openCart } = useCafe();
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <Brand />
      <button
        aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={menuOpen}
        className="mobile-menu-toggle"
        onClick={() => setMenuOpen((open) => !open)}
        type="button"
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      <nav className={`main-nav${menuOpen ? " main-nav-open" : ""}`} aria-label="Main navigation">
        <Link href="/menu" onClick={closeMenu}>The menu</Link>
        <Link href="/about" onClick={closeMenu}>Our story</Link>
        <Link href="/find-us" onClick={closeMenu}>Find us</Link>
        <button className="nav-order" onClick={openCart} type="button">
          <ShoppingBag aria-hidden="true" size={16} />
          <span>Your bag</span>
          <span aria-live="polite" className="bag-count">{count}</span>
        </button>
      </nav>
    </header>
  );
}
