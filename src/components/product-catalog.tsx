"use client";

import { ArrowRight, ArrowUpRight, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCafe } from "@/components/cafe-provider";
import { Product } from "@/lib/types";

const filters = ["Everything", "Coffee", "Not coffee", "Something good"];
const photo = (id: string, width = 700) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=70`;
const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export function ProductCatalog({ featured = false }: { featured?: boolean }) {
  const { products, loadingProducts, productError, addToCart } = useCafe();
  const [category, setCategory] = useState("Everything");
  const [selected, setSelected] = useState<Product | null>(null);
  const [added, setAdded] = useState("");
  const visibleProducts = useMemo(() => {
    const matched = products.filter((item) => category === "Everything" || item.category === category);
    return featured ? matched.slice(0, 6) : matched;
  }, [products, category, featured]);

  useEffect(() => {
    if (!selected) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selected]);

  function add(product: Product) {
    addToCart(product.id);
    setAdded(product.name);
    window.setTimeout(() => setAdded(""), 1600);
  }

  return (
    <>
      <div aria-label="Filter products" className="category-list" role="group">
        {filters.map((item) => (
          <button
            aria-pressed={category === item}
            className={`category-chip${category === item ? " category-chip-active" : ""}`}
            key={item}
            onClick={() => setCategory(item)}
            type="button"
          >{item}</button>
        ))}
      </div>
      {loadingProducts && <p className="catalog-message">Loading menu…</p>}
      {!loadingProducts && productError && <p className="catalog-error" role="alert">{productError}</p>}
      {!loadingProducts && !productError && visibleProducts.length === 0 && <p className="catalog-message">No products in this category yet.</p>}
      <div className="menu-grid">
        {visibleProducts.map((product) => (
          <article className="menu-card" key={product.id}>
            <button
              aria-label={`View details for ${product.name}`}
              className="menu-card-open"
              onClick={() => setSelected(product)}
              type="button"
            >
              <span className="menu-card-image">
                <img alt={product.name} decoding="async" loading="lazy" src={photo(product.image)} />
                <span className="quick-view-label">View details <ArrowUpRight size={14} /></span>
              </span>
            </button>
            <div className="menu-card-info">
              <div>
                <h3><button className="product-name-button" onClick={() => setSelected(product)} type="button">{product.name}</button></h3>
                <p>{product.note}</p>
              </div>
              <span className="menu-price">{money(product.priceCents)}</span>
            </div>
            <div className="menu-card-actions">
              <button className="details-button" onClick={() => setSelected(product)} type="button">Details <ArrowUpRight size={13} /></button>
              <button aria-label={`Add ${product.name} to your bag`} className={`add-button${added === product.name ? " add-button-added" : ""}`} onClick={() => add(product)} type="button">
                <span>{added === product.name ? "Added" : "Add"}</span><Plus size={17} />
              </button>
            </div>
          </article>
        ))}
      </div>
      {selected && (
        <div className="quick-view-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelected(null);
        }}>
          <section aria-labelledby="quick-view-title" aria-modal="true" className="quick-view-dialog" role="dialog">
            <button aria-label="Close product details" autoFocus className="quick-view-close" onClick={() => setSelected(null)} type="button"><X size={21} /></button>
            <div className="quick-view-image"><img alt={selected.name} decoding="async" loading="eager" src={photo(selected.image, 800)} /></div>
            <div className="quick-view-copy">
              <span className="product-category-label">{selected.category}</span>
              <h2 id="quick-view-title">{selected.name}</h2>
              <p>{selected.note}.</p>
              <div className="quick-view-bottom">
                <span className="quick-view-price">{money(selected.priceCents)}</span>
                <button className="cafe-button cafe-button-dark" onClick={() => { add(selected); setSelected(null); }} type="button">Add to bag <Plus size={16} /></button>
              </div>
            </div>
          </section>
        </div>
      )}
      {added && <div aria-live="polite" className="cart-toast">{added} added to bag <ArrowRight size={14} /></div>}
      {featured && <a className="cafe-button cafe-button-outline menu-full-link" href="/menu">Full menu <ArrowRight size={16} /></a>}
    </>
  );
}
