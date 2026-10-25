"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CartItem, Product } from "@/lib/types";

type CafeContextValue = {
  products: Product[];
  cart: CartItem[];
  cartOpen: boolean;
  loadingProducts: boolean;
  productError: string;
  addToCart: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  openCart: () => void;
  closeCart: () => void;
  refreshProducts: () => Promise<void>;
};

const CafeContext = createContext<CafeContextValue | null>(null);
const storageKey = "goodkind-cart-v1";

export function CafeProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState("");

  const refreshProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const response = await fetch("/api/products", { cache: "no-store" });
      if (!response.ok) throw new Error("The menu could not be loaded.");
      const items = await response.json() as Product[];
      setProducts(items);
      setProductError("");
    } catch (error) {
      setProductError(error instanceof Error ? error.message : "The menu could not be loaded.");
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    void refreshProducts();
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as CartItem[];
        if (Array.isArray(parsed)) {
          setCart(parsed.filter((item) =>
            typeof item.productId === "string" && Number.isInteger(item.quantity)
            && item.quantity > 0 && item.quantity <= 30,
          ));
        }
      }
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [refreshProducts]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(cart));
  }, [cart]);

  const addToCart = useCallback((productId: string, quantity = 1) => {
    setCart((current) => {
      const existing = current.find((item) => item.productId === productId);
      if (!existing) return [...current, { productId, quantity }];
      return current.map((item) => item.productId === productId
        ? { ...item, quantity: Math.min(30, item.quantity + quantity) }
        : item);
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setCart((current) => quantity < 1
      ? current.filter((item) => item.productId !== productId)
      : current.map((item) => item.productId === productId
        ? { ...item, quantity: Math.min(30, quantity) }
        : item));
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((current) => current.filter((item) => item.productId !== productId));
  }, []);

  const value = useMemo(() => ({
    products,
    cart,
    cartOpen,
    loadingProducts,
    productError,
    addToCart,
    setQuantity,
    removeFromCart,
    openCart: () => setCartOpen(true),
    closeCart: () => setCartOpen(false),
    refreshProducts,
  }), [products, cart, cartOpen, loadingProducts, productError, addToCart, setQuantity, removeFromCart, refreshProducts]);

  return <CafeContext.Provider value={value}>{children}</CafeContext.Provider>;
}

export function useCafe() {
  const context = useContext(CafeContext);
  if (!context) throw new Error("useCafe must be used within CafeProvider.");
  return context;
}
