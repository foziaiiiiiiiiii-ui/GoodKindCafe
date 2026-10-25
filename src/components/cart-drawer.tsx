"use client";

import Image from "next/image";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useCafe } from "@/components/cafe-provider";

const imageUrl = (id: string, width = 240) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export function CartDrawer() {
  const { products, cart, cartOpen, closeCart, setQuantity, removeFromCart } = useCafe();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState("");

  const lines = useMemo(() => cart.flatMap((item) => {
    const product = products.find((entry) => entry.id === item.productId);
    return product ? [{ ...item, product }] : [];
  }), [cart, products]);
  const total = lines.reduce((sum, line) => sum + line.product.priceCents * line.quantity, 0);

  useEffect(() => {
    if (!cartOpen) return undefined;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = priorOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [cartOpen, closeCart]);

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!lines.length) {
      setError("Your bag is empty.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          items: lines.map(({ productId, quantity }) => ({ productId, quantity })),
        }),
      });
      const result = await response.json() as { id?: string; error?: string };
      if (!response.ok) throw new Error(result.error || "Your order could not be submitted.");
      localStorage.removeItem("goodkind-cart-v1");
      lines.forEach((line) => removeFromCart(line.productId));
      setConfirmed(result.id || "submitted");
      setName("");
      setPhone("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Your order could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!cartOpen) return null;

  return (
    <div className="cart-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) closeCart();
    }}>
      <aside aria-labelledby="cart-title" aria-modal="true" className="cart-drawer" role="dialog">
        <div className="cart-header">
          <div><span className="cart-overline">Goodkind Coffee</span><h2 id="cart-title">Your bag <span>({lines.reduce((sum, line) => sum + line.quantity, 0)})</span></h2></div>
          <button aria-label="Close bag" className="icon-button" onClick={closeCart} type="button"><X size={21} /></button>
        </div>
        {confirmed ? (
          <div className="cart-success">
            <span className="success-icon"><ShoppingBag size={23} /></span>
            <h3>Order received</h3>
            <p>Your order <strong>{confirmed.slice(0, 8)}</strong> has been sent to the café.</p>
            <button className="cafe-button cafe-button-dark" onClick={() => { setConfirmed(""); closeCart(); }} type="button">Done</button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {lines.length ? lines.map(({ product, productId, quantity }) => (
                <article className="cart-line" key={productId}>
                  <Image alt="" height={76} src={imageUrl(product.image)} width={76} />
                  <div className="cart-line-info">
                    <strong>{product.name}</strong>
                    <span>{money(product.priceCents)}</span>
                    <div className="quantity-control">
                      <button aria-label={`Remove one ${product.name}`} onClick={() => setQuantity(productId, quantity - 1)} type="button"><Minus size={13} /></button>
                      <span>{quantity}</span>
                      <button aria-label={`Add one ${product.name}`} onClick={() => setQuantity(productId, quantity + 1)} type="button"><Plus size={13} /></button>
                    </div>
                  </div>
                  <button aria-label={`Remove ${product.name}`} className="remove-line" onClick={() => removeFromCart(productId)} type="button"><Trash2 size={16} /></button>
                </article>
              )) : <div className="empty-cart"><ShoppingBag size={27} /><p>Your bag is empty.</p><span>Choose something from the menu to get started.</span></div>}
            </div>
            <form className="checkout-form" onSubmit={submitOrder}>
              <h3>Pickup details</h3>
              <label>Your name<input autoComplete="name" onChange={(event) => setName(event.target.value)} required value={name} /></label>
              <label>Phone number<input autoComplete="tel" onChange={(event) => setPhone(event.target.value)} required type="tel" value={phone} /></label>
              {error && <p className="form-error" role="alert">{error}</p>}
              <div className="cart-total"><span>Total</span><strong>{money(total)}</strong></div>
              <button className="cafe-button cafe-button-dark checkout-button" disabled={!lines.length || submitting} type="submit">
                {submitting ? "Sending…" : "Send pickup order"} <ArrowRight size={16} />
              </button>
              <p className="checkout-note">This sends an order request to the café. Pay when you pick up.</p>
            </form>
          </>
        )}
      </aside>
    </div>
  );
}
