import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCatalog } from "@/components/product-catalog";

const heroImage = "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1280&q=72";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Independent café · Lower East Side</p>
          <h1>Coffee &<br /><em>pastries.</em></h1>
          <p className="hero-description">Espresso, seasonal drinks, and pastries baked here each morning.</p>
          <div className="hero-actions">
            <Link className="cafe-button cafe-button-dark" href="/menu">View the menu <ArrowRight size={16} /></Link>
          </div>
        </div>
        <div className="hero-visual">
          <img alt="Pour-over coffee being prepared at the café" className="hero-image" decoding="async" fetchPriority="high" src={heroImage} />
        </div>
      </section>

      <section className="menu-section section-pad" id="menu">
        <div className="section-topline">
          <p className="eyebrow">Menu</p>
          <span className="section-number">01 — MENU</span>
        </div>
        <div className="menu-heading">
          <h2>Drinks & <em>bakery.</em></h2>
          <p>Seasonal coffee, tea, and pastries. Prepared fresh each day.</p>
        </div>
        <ProductCatalog featured />
      </section>

      <section className="home-about">
        <div className="home-about-image">
          <img alt="Hands holding a freshly made cup of coffee" decoding="async" loading="lazy" src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=68" />
        </div>
        <div className="home-about-copy">
          <p className="eyebrow">About Goodkind</p>
          <h2>Good coffee.<br /><em>Good neighbors.</em></h2>
          <p>Goodkind is an independent café on Orchard Street. We serve carefully sourced coffee and pastries made in our kitchen.</p>
          <Link className="text-link" href="/about">Our story <ArrowRight size={16} /></Link>
        </div>
      </section>
      <div className="home-visit-link"><span>18 Orchard Street · New York</span><Link href="/find-us">Hours & directions <ArrowRight size={15} /></Link></div>
    </main>
  );
}
