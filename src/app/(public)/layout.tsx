import { CafeProvider } from "@/components/cafe-provider";
import { CartDrawer } from "@/components/cart-drawer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <CafeProvider>
      <div id="top" className="public-site">
        <SiteHeader />
        {children}
        <SiteFooter />
      </div>
      <CartDrawer />
    </CafeProvider>
  );
}
