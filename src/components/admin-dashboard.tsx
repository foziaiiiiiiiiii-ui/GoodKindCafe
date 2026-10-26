"use client";

import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  Box,
  Check,
  ChevronDown,
  CircleHelp,
  Coffee,
  Command,
  ExternalLink,
  FilePlus2,
  Gauge,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  Package,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CafeOrder, Product } from "@/lib/types";

type AdminView = "overview" | "products" | "orders";
type ProductDraft = Omit<Product, "id" | "available">;

const defaultDraft: ProductDraft = {
  name: "",
  category: "Coffee",
  priceCents: 500,
  note: "",
  image: "photo-1461023058943-07fcbe16d735",
};
const price = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const date = (value: string) => new Date(`${value.replace(" ", "T")}Z`).toLocaleString(undefined, {
  month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
});

export function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [password, setPassword] = useState("");
  const [view, setView] = useState<AdminView>("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<CafeOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<"new" | Product | null>(null);
  const [draft, setDraft] = useState<ProductDraft>(defaultDraft);
  const [saving, setSaving] = useState(false);

  const api = useCallback(async (url: string, init?: RequestInit) => {
    const response = await fetch(url, {
      ...init,
      headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
    });
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Request failed.");
    return payload;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [productData, orderData] = await Promise.all([
        api("/api/admin/products"),
        api("/api/admin/orders"),
      ]);
      setProducts(productData as unknown as Product[]);
      setOrders(orderData as unknown as CafeOrder[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load admin data.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/session")
      .then((response) => response.json())
      .then((data: { authenticated?: boolean }) => {
        if (!active) return;
        setAuthenticated(Boolean(data.authenticated));
        setCheckingSession(false);
        if (data.authenticated) void refresh();
      })
      .catch(() => {
        if (active) {
          setCheckingSession(false);
          setError("Could not connect to the café server.");
        }
      });
    return () => { active = false; };
  }, [refresh]);

  const filteredProducts = useMemo(() => products.filter((product) =>
    `${product.name} ${product.category} ${product.note}`.toLowerCase().includes(search.toLowerCase()),
  ), [products, search]);
  const filteredOrders = useMemo(() => orders.filter((order) =>
    `${order.customerName} ${order.customerEmail ?? ""} ${order.id} ${order.status}`.toLowerCase().includes(search.toLowerCase()),
  ), [orders, search]);
  const activeProducts = products.filter((product) => product.available).length;
  const newOrders = orders.filter((order) => order.status === "new").length;
  const orderValue = orders.reduce((sum, order) => sum + order.totalCents, 0);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await api("/api/admin/session", { method: "POST", body: JSON.stringify({ password }) });
      setAuthenticated(true);
      setPassword("");
      await refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Could not sign in.");
    }
  }

  async function signOut() {
    try {
      await api("/api/admin/session", { method: "DELETE" });
      setAuthenticated(false);
      setProducts([]);
      setOrders([]);
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Could not sign out.");
    }
  }

  function openProduct(product?: Product) {
    setDraft(product ? {
      name: product.name,
      category: product.category,
      priceCents: product.priceCents,
      note: product.note,
      image: product.image,
    } : defaultDraft);
    setDialog(product || "new");
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const editing = dialog && typeof dialog === "object" ? dialog : null;
      await api(editing ? `/api/admin/products/${editing.id}` : "/api/admin/products", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(draft),
      });
      setDialog(null);
      setNotice(editing ? "Product updated." : "Product created.");
      await refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save product.");
    } finally {
      setSaving(false);
    }
  }

  async function archiveProduct(product: Product) {
    if (!window.confirm(`Archive "${product.name}" from the public menu?`)) return;
    try {
      await api(`/api/admin/products/${product.id}`, { method: "DELETE" });
      setNotice("Product archived from the public menu.");
      await refresh();
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : "Could not archive product.");
    }
  }

  async function updateOrder(order: CafeOrder, status: string) {
    try {
      await api(`/api/admin/orders/${order.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setOrders((current) => current.map((item) => item.id === order.id ? { ...item, status: status as CafeOrder["status"] } : item));
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Could not update order.");
    }
  }

  if (checkingSession) {
    return <div className="admin-loading"><span className="admin-spinner" />Checking admin session…</div>;
  }

  if (!authenticated) {
    return (
      <div className="admin-login-wrap">
        <div className="admin-login-brand"><span className="admin-brand-icon"><Coffee size={20} /></span> GOODKIND <span>/ ADMIN</span></div>
        <form className="admin-login" onSubmit={signIn}>
          <div className="login-lock"><LockKeyhole size={22} /></div>
          <p className="admin-kicker">GOODKIND OPERATIONS</p>
          <h1>Admin sign in</h1>
          <p className="admin-login-help">Enter the password configured by the café owner.</p>
          <label htmlFor="admin-password">Password</label>
          <input autoComplete="current-password" autoFocus id="admin-password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
          {error && <p className="admin-error" role="alert">{error}</p>}
          <button className="admin-primary login-submit" type="submit">Sign in <ArrowRight size={15} /></button>
          <a className="admin-back-link" href="/">← Back to Goodkind</a>
        </form>
      </div>
    );
  }

  const productsView = view === "products";
  const ordersView = view === "orders";

  return (
    <div className="admin-frame">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/"><span className="admin-brand-icon"><Coffee size={18} /></span> goodkind<span className="admin-brand-dot">.</span><span className="admin-brand-admin">ADMIN</span></a>
        <button className="admin-search-shortcut" onClick={() => document.getElementById("admin-search")?.focus()} type="button"><Search size={15} /> Search <kbd>⌘ K</kbd></button>
        <div className="admin-side-group">
          <span className="admin-side-label">WORKSPACE</span>
          <button className={`admin-side-link${view === "overview" ? " active" : ""}`} onClick={() => { setView("overview"); setSearch(""); }} type="button"><LayoutDashboard size={16} /> Overview</button>
          <button className={`admin-side-link${productsView ? " active" : ""}`} onClick={() => { setView("products"); setSearch(""); }} type="button"><Utensils size={16} /> Products <span className="side-count">{activeProducts}</span></button>
          <button className={`admin-side-link${ordersView ? " active" : ""}`} onClick={() => { setView("orders"); setSearch(""); }} type="button"><ShoppingBag size={16} /> Pickup orders {newOrders > 0 && <span className="side-count side-count-alert">{newOrders}</span>}</button>
        </div>
        <div className="admin-side-group">
          <span className="admin-side-label">TOOLS</span>
          <a className="admin-side-link" href="/"><Box size={16} /> Public website <ExternalLink size={13} /></a>
          <button className="admin-side-link" onClick={() => void refresh()} type="button"><Activity size={16} /> Refresh data</button>
        </div>
        <div className="admin-sidebar-bottom">
          <div className="admin-user-avatar">G</div>
          <div className="admin-user-copy"><strong>Goodkind Coffee</strong><span>Administrator</span></div>
          <button aria-label="Sign out" className="admin-icon-button" onClick={() => void signOut()} type="button"><LogOut size={16} /></button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb"><span>Goodkind</span><span>/</span><strong>{productsView ? "Products" : ordersView ? "Pickup orders" : "Overview"}</strong></div>
          <select
            aria-label="Admin section"
            className="admin-mobile-view"
            onChange={(event) => { setView(event.target.value as AdminView); setSearch(""); }}
            value={view}
          >
            <option value="overview">Overview</option>
            <option value="products">Products</option>
            <option value="orders">Pickup orders</option>
          </select>
          <div className="admin-top-actions"><span className="admin-server-status"><span /> Server connected</span><button className="admin-top-link" onClick={() => void refresh()} type="button"><Activity size={14} /> Refresh</button><a className="admin-help-link" href="mailto:hello@goodkind.coffee"><CircleHelp size={15} /> Support</a></div>
        </header>
        <main className="admin-content">
          <div className="admin-page-heading">
            <div><p className="admin-kicker">GOODKIND · OPERATIONS</p><h1>{productsView ? "Products" : ordersView ? "Pickup orders" : "Overview"}</h1><p>{productsView ? "Manage the products on your public menu." : ordersView ? "Orders submitted from the café website." : "Menu and pickup activity for your café."}</p></div>
            {productsView && <button className="admin-primary" onClick={() => openProduct()} type="button"><Plus size={16} /> Add product</button>}
            {ordersView && <button className="admin-secondary" onClick={() => void refresh()} type="button"><ArrowDownToLine size={15} /> Refresh orders</button>}
          </div>

          {error && <div className="admin-alert" role="alert"><span>{error}</span><button aria-label="Dismiss error" onClick={() => setError("")} type="button"><X size={15} /></button></div>}
          {notice && <div className="admin-notice" role="status"><Check size={15} />{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")} type="button"><X size={15} /></button></div>}

          {!productsView && !ordersView && (
            <div className="admin-stat-grid">
              <article className="admin-stat-card"><span>ACTIVE PRODUCTS</span><strong>{activeProducts}</strong><small><Package size={14} /> Listed on the public menu</small></article>
              <article className="admin-stat-card"><span>NEW PICKUP ORDERS</span><strong>{newOrders}</strong><small><ShoppingBag size={14} /> Awaiting a status update</small></article>
              <article className="admin-stat-card"><span>ORDERS RECEIVED</span><strong>{orders.length}</strong><small><Activity size={14} /> Total orders in this database</small></article>
              <article className="admin-stat-card"><span>ORDER VALUE</span><strong>{price(orderValue)}</strong><small><Gauge size={14} /> Submitted order totals</small></article>
            </div>
          )}

          {!ordersView && (
            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div><h2>{productsView ? "Menu products" : "Public menu"}</h2><p>{products.length} products · {activeProducts} visible</p></div>
                <div className="admin-panel-actions">
                  <label className="admin-table-search"><Search size={14} /><input id="admin-search" onChange={(event) => setSearch(event.target.value)} placeholder="Filter products…" value={productsView ? search : ""} /></label>
                  {!productsView && <button className="admin-text-action" onClick={() => setView("products")} type="button">Manage products <ArrowRight size={14} /></button>}
                </div>
              </div>
              <div className="admin-table-scroll">
                <table className="admin-table">
                  <thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>PRICE</th><th>VISIBILITY</th><th /></tr></thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td><span className="table-product-icon"><Coffee size={16} /></span><strong>{product.name}</strong><small>{product.note}</small></td>
                        <td><span className="admin-category">{product.category}</span></td>
                        <td>{price(product.priceCents)}</td>
                        <td><span className={`admin-status ${product.available ? "status-live" : "status-hidden"}`}><i />{product.available ? "Published" : "Archived"}</span></td>
                        <td className="table-actions"><button aria-label={`Edit ${product.name}`} onClick={() => openProduct(product)} type="button"><Settings2 size={15} /></button>{product.available === 1 && <button aria-label={`Archive ${product.name}`} onClick={() => void archiveProduct(product)} type="button"><Trash2 size={15} /></button>}</td>
                      </tr>
                    ))}
                    {!filteredProducts.length && <tr><td className="admin-empty-cell" colSpan={5}>{loading ? "Loading products…" : "No products match this filter."}</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {!productsView && (
            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div><h2>{ordersView ? "All pickup orders" : "Recent pickup orders"}</h2><p>{orders.length} submitted orders</p></div>
                <label className="admin-table-search"><Search size={14} /><input id="admin-search" onChange={(event) => setSearch(event.target.value)} placeholder="Search orders…" value={ordersView ? search : ""} /></label>
              </div>
              <div className="admin-table-scroll">
                <table className="admin-table order-table">
                  <thead><tr><th>ORDER</th><th>CUSTOMER</th><th>ITEMS</th><th>TOTAL</th><th>STATUS</th><th>PLACED</th></tr></thead>
                  <tbody>
                    {filteredOrders.slice(0, ordersView ? undefined : 5).map((order) => (
                      <tr key={order.id}>
                        <td><code>#{order.id.slice(0, 8)}</code></td>
                        <td><strong>{order.customerName}</strong><small>{order.customerEmail || "Email not recorded"}</small></td>
                        <td><span className="order-items-summary">{order.items.map((item) => `${item.quantity}× ${item.name}`).join(", ")}</span></td>
                        <td>{price(order.totalCents)}</td>
                        <td><label className={`order-status-select status-${order.status}`}><select aria-label={`Update order ${order.id.slice(0, 8)} status`} onChange={(event) => void updateOrder(order, event.target.value)} value={order.status}><option value="new">New</option><option value="accepted">Accepted</option><option value="ready">Ready</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select><ChevronDown size={12} /></label></td>
                        <td>{date(order.createdAt)}</td>
                      </tr>
                    ))}
                    {!filteredOrders.length && <tr><td className="admin-empty-cell" colSpan={6}>{loading ? "Loading orders…" : "No orders have been submitted yet."}</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <div className="admin-footnote"><ShieldCheck size={14} /> Data is stored in the local SQLite database on this server.</div>
        </main>
      </div>
      <aside className="admin-insights">
        <div className="insights-heading"><h2>Service status</h2><span className="admin-server-status"><i /> Online</span></div>
        <section className="insight-card"><p className="admin-kicker">DATABASE</p><div className="insight-big"><Activity size={18} /> SQLite</div><p>Persistent local café database</p><div className="insight-meter"><span /></div><small>Products and submitted orders</small></section>
        <section className="insight-card"><p className="admin-kicker">MENU HEALTH</p><div className="insight-number">{activeProducts}<span> / {products.length}</span></div><p>Products published</p><div className="insight-divider" /><div className="insight-row"><span>Pickup orders</span><strong>{orders.length}</strong></div><div className="insight-row"><span>Needs attention</span><strong>{newOrders}</strong></div></section>
        <section className="access-card"><div className="access-icon"><LockKeyhole size={17} /></div><div><h3>Admin access</h3><p>Password-protected session. Use a long unique secret in the server environment.</p></div></section>
        <div className="admin-build-info"><Command size={14} /> GOODKIND ADMIN <span>·</span> LOCAL SERVER</div>
      </aside>

      {dialog && (
        <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}>
          <form className="admin-product-modal" onSubmit={saveProduct}>
            <header><div><p className="admin-kicker">MENU MANAGEMENT</p><h2>{typeof dialog === "object" ? "Edit product" : "Add a product"}</h2></div><button aria-label="Close product form" className="admin-icon-button" onClick={() => setDialog(null)} type="button"><X size={18} /></button></header>
            <label>Product name<input maxLength={100} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required value={draft.name} /></label>
            <div className="admin-form-row">
              <label>Category<select onChange={(event) => setDraft({ ...draft, category: event.target.value })} value={draft.category}><option>Coffee</option><option>Not coffee</option><option>Something good</option></select></label>
              <label>Price (USD)<input min="0" onChange={(event) => setDraft({ ...draft, priceCents: Math.round(Number(event.target.value) * 100) })} required step="0.01" type="number" value={(draft.priceCents / 100).toFixed(2)} /></label>
            </div>
            <label>Description<input maxLength={240} onChange={(event) => setDraft({ ...draft, note: event.target.value })} required value={draft.note} /></label>
            <label>Unsplash photo ID<input onChange={(event) => setDraft({ ...draft, image: event.target.value })} required value={draft.image} /><small>Use the photo ID part of an images.unsplash.com URL, e.g. photo-1461023058943-07fcbe16d735</small></label>
            {error && <p className="admin-error" role="alert">{error}</p>}
            <footer><button className="admin-secondary" onClick={() => setDialog(null)} type="button">Cancel</button><button className="admin-primary" disabled={saving} type="submit">{saving ? "Saving…" : "Save product"} <Check size={15} /></button></footer>
          </form>
        </div>
      )}
    </div>
  );
}
