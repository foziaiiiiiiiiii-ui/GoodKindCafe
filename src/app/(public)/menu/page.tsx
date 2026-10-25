import type { Metadata } from "next";
import { ProductCatalog } from "@/components/product-catalog";

export const metadata: Metadata = { title: "Menu" };

export default function MenuPage() {
  return (
    <main className="subpage">
      <section className="subpage-heading">
        <p className="eyebrow">Goodkind Coffee · Orchard Street</p>
        <h1>Drinks & <em>bakery.</em></h1>
        <p>Our current menu. Everything is made fresh and available while it lasts.</p>
      </section>
      <section className="menu-section section-pad menu-page-section">
        <div className="section-topline"><p className="eyebrow">The menu</p><span className="section-number">Updated daily</span></div>
        <ProductCatalog />
      </section>
    </main>
  );
}
