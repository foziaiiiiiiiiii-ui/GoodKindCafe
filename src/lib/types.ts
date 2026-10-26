export type Product = {
  id: string;
  name: string;
  category: string;
  priceCents: number;
  note: string;
  image: string;
  available: number;
};

export type CartItem = {
  productId: string;
  quantity: number;
};

export type OrderItem = CartItem & {
  name: string;
  unitPriceCents: number;
};

export type CafeOrder = {
  id: string;
  customerName: string;
  customerEmail: string | null;
  items: OrderItem[];
  totalCents: number;
  status: "new" | "accepted" | "ready" | "completed" | "cancelled";
  createdAt: string;
};
