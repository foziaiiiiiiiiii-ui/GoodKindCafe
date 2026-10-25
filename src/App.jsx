import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Clock3,
  Coffee,
  Instagram,
  MapPin,
  Menu as MenuIcon,
  Plus,
  ShoppingBag,
  X,
} from "lucide-react";

const photo = (id, width = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

const drinks = [
  {
    name: "Honey oat latte",
    category: "Coffee",
    price: "$6",
    note: "Double espresso · oat milk · local honey",
    image: "photo-1461023058943-07fcbe16d735",
    tag: "A house favorite",
  },
  {
    name: "Maple cloud",
    category: "Coffee",
    price: "$6.50",
    note: "Cold brew · maple cream · pinch of sea salt",
    image: "photo-1517701604599-bb29b565090c",
    tag: "Cold & lovely",
  },
  {
    name: "Piccolo",
    category: "Coffee",
    price: "$4.50",
    note: "A little latte with a big personality",
    image: "photo-1570968915860-54d5c301fa9f",
    tag: "Just the right size",
  },
  {
    name: "Matcha morning",
    category: "Not coffee",
    price: "$6",
    note: "Ceremonial matcha · your choice of milk",
    image: "photo-1515823064-d6e0c04616a7",
    tag: "A softer start",
  },
  {
    name: "Cardamom bun",
    category: "Something good",
    price: "$5",
    note: "Twisted by hand · baked every morning",
    image: "photo-1509365465985-25d11c17e812",
    tag: "Still warm",
  },
  {
    name: "Olive oil cake",
    category: "Something good",
    price: "$6",
    note: "Citrus, good olive oil, no occasion needed",
    image: "photo-1578985545062-69928b1d9587",
    tag: "A little slice",
  },
];

const categories = ["Everything", "Coffee", "Not coffee", "Something good"];

const hours = [
  ["Monday – Friday", "7:30 am – 5 pm"],
  ["Saturday", "8 am – 5 pm"],
  ["Sunday", "8 am – 3 pm"],
];

function Brand({ light = false }) {
  return (
    <a className={`brand ${light ? "brand-light" : ""}`} href="#home" aria-label="Goodkind home">
      <span className="brand-mark"><Coffee size={22} strokeWidth={2.2} /></span>
      <span>goodkind<span className="brand-period">.</span></span>
    </a>
  );
}

function Eyebrow({ children, light = false }) {
  return <p className={`eyebrow ${light ? "eyebrow-light" : ""}`}>{children}</p>;
}

function App() {
  const [category, setCategory] = useState("Everything");
  const [cartCount, setCartCount] = useState(0);
  const [toast, setToast] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!selectedDrink) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function closeOnEscape(event) {
      if (event.key === "Escape") setSelectedDrink(null);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedDrink]);

  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [category]);

  const visibleDrinks = drinks.filter(
    (drink) => category === "Everything" || drink.category === category,
  );

  function addToBag(name) {
    setCartCount((count) => count + 1);
    setToast(`${name} added to your bag`);
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <main id="home">
      <header className="site-header">
        <Brand />
        <nav className={`main-nav ${mobileMenuOpen ? "main-nav-open" : ""}`} aria-label="Main navigation">
          <a href="#menu" onClick={closeMobileMenu}>The menu</a>
          <a href="#story" onClick={closeMobileMenu}>Our story</a>
          <a href="#visit" onClick={closeMobileMenu}>Find us</a>
          <a className="nav-order" href="#menu" onClick={closeMobileMenu}>
            <ShoppingBag size={16} aria-hidden="true" />
            Your bag <span className="bag-count">{cartCount}</span>
          </a>
        </nav>
        <button
          aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileMenuOpen}
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen((open) => !open)}
          type="button"
        >
          {mobileMenuOpen ? <X size={23} /> : <MenuIcon size={23} />}
        </button>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <Eyebrow>Independent café · Lower East Side</Eyebrow>
          <h1>Coffee &<br /><em>pastries.</em></h1>
          <p className="hero-description">Espresso, seasonal drinks, and pastries baked here each morning.</p>
          <div className="hero-actions">
            <a className="button button-dark" href="#menu">
              View the menu <ArrowRight size={17} aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="hero-visual">
          <img
            alt="Freshly made latte on a café table"
            className="hero-image"
            src={photo("photo-1442512595331-e89e73853f31", 1500)}
          />
        </div>
      </section>

      <section className="menu-section section-pad" id="menu">
        <div className="section-topline">
          <Eyebrow>Menu</Eyebrow>
          <span className="section-number">01 — MENU</span>
        </div>
        <div className="menu-heading">
          <h2>Drinks & <em>bakery.</em></h2>
          <p>Seasonal coffee, tea, and pastries. Prepared fresh each day.</p>
        </div>
        <div className="category-list" role="group" aria-label="Filter menu by category">
          {categories.map((item) => (
            <button
              aria-pressed={category === item}
              className={`category-chip ${category === item ? "category-chip-active" : ""}`}
              key={item}
              onClick={() => setCategory(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
        <div className="menu-grid">
          {visibleDrinks.map((drink) => (
            <article className="menu-card reveal" key={drink.name}>
              <button
                aria-label={`View details for ${drink.name}`}
                className="menu-card-open"
                onClick={() => setSelectedDrink(drink)}
                type="button"
              >
                <span className="menu-card-image">
                  <img alt="" loading="lazy" src={photo(drink.image, 700)} />
                  <span className="menu-tag">{drink.tag}</span>
                  <span className="quick-view-label">Quick look <ArrowUpRight size={14} /></span>
                </span>
              </button>
              <div className="menu-card-info">
                <div>
                  <h3>
                    <button
                      className="product-name-button"
                      onClick={() => setSelectedDrink(drink)}
                      type="button"
                    >
                      {drink.name}
                    </button>
                  </h3>
                  <p>{drink.note}</p>
                </div>
                <span className="menu-price">{drink.price}</span>
              </div>
              <div className="menu-card-actions">
                <button
                  className="details-button"
                  onClick={() => setSelectedDrink(drink)}
                  type="button"
                >
                  Details <ArrowUpRight size={13} aria-hidden="true" />
                </button>
                <button
                  aria-label={`Add ${drink.name} to your bag`}
                  className="add-button"
                  onClick={() => addToBag(drink.name)}
                  type="button"
                >
                  <span className="add-button-label">Add</span>
                  <Plus size={19} aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="story-section reveal" id="story">
        <div className="story-image">
          <img
            alt="Barista carefully preparing a pour-over coffee"
            loading="lazy"
            src={photo("photo-1495474472287-4d71bcdd2085", 1100)}
          />
        </div>
        <div className="story-copy">
          <Eyebrow>About</Eyebrow>
          <h2>Good coffee.<br /><em>Good neighbors.</em></h2>
          <p>
            Goodkind is an independent café on Orchard Street. We serve
            carefully sourced coffee and pastries made in our kitchen.
          </p>
          <p>
            Our menu changes with the season. Stop by for espresso, a
            slow-poured filter, or something fresh from the bakery.
          </p>
          <a className="text-link story-link" href="#visit">
            Visit the café <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className="visit-section section-pad reveal" id="visit">
        <div className="section-topline">
          <Eyebrow>Visit</Eyebrow>
          <span className="section-number">02 — HOURS & LOCATION</span>
        </div>
        <div className="visit-grid">
          <div className="visit-copy">
            <h2>Visit<br /><em>Goodkind.</em></h2>
            <p className="visit-intro">18 Orchard Street, Lower East Side, New York.</p>
            <a
              className="address-link"
              href="https://maps.google.com/?q=18+Orchard+Street+New+York+NY+10002"
              rel="noreferrer"
              target="_blank"
            >
              <span className="address-icon"><MapPin size={19} /></span>
              <span><strong>18 Orchard Street</strong><br />New York, NY 10002</span>
              <ArrowUpRight className="address-arrow" size={17} />
            </a>
            <div className="hours-block">
              <h3><Clock3 size={17} /> Opening hours</h3>
              {hours.map(([day, time]) => (
                <div className="hours-row" key={day}><span>{day}</span><span>{time}</span></div>
              ))}
            </div>
          </div>
          <div className="visit-photo">
            <img alt="A welcoming neighborhood café interior" loading="lazy" src={photo("photo-1554118811-1e0d58224f24", 1100)} />
            <a
              aria-label="Open directions to Goodkind Coffee in Google Maps"
              className="map-float-button"
              href="https://maps.google.com/?q=18+Orchard+Street+New+York+NY+10002"
              rel="noreferrer"
              target="_blank"
            >
              <MapPin size={17} /> Get directions <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-brand"><Brand light /></div>
          <div className="footer-links">
            <div><span className="footer-label">WANDER AROUND</span><a href="#menu">The menu</a><a href="#story">Our story</a><a href="#visit">Find us</a></div>
            <div><span className="footer-label">SAY HELLO</span><a href="mailto:hello@goodkind.coffee">Email us <ArrowUpRight size={13} /></a><a href="https://www.instagram.com/" rel="noreferrer" target="_blank">Instagram <Instagram size={13} /></a><a href="tel:+12125550184">+1 (212) 555-0184</a></div>
          </div>
        </div>
        <div className="footer-bottom"><span>© 2025 GOODKIND COFFEE CO.</span><a href="#home">BACK TO TOP ↑</a></div>
      </footer>

      {toast && (
        <div className="toast-message" role="status">
          <span className="toast-check">✓</span>{toast}
          <button aria-label="Dismiss notification" onClick={() => setToast("")} type="button"><X size={16} /></button>
        </div>
      )}
      {selectedDrink && (
        <div
          className="quick-view-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedDrink(null);
          }}
        >
          <section
            aria-labelledby="quick-view-title"
            aria-modal="true"
            className="quick-view-dialog"
            role="dialog"
          >
            <button
              aria-label="Close product details"
              autoFocus
              className="quick-view-close"
              onClick={() => setSelectedDrink(null)}
              type="button"
            >
              <X size={21} />
            </button>
            <div className="quick-view-image">
              <img alt={selectedDrink.name} src={photo(selectedDrink.image, 900)} />
              <span className="menu-tag">{selectedDrink.tag}</span>
            </div>
            <div className="quick-view-copy">
              <Eyebrow>{selectedDrink.category}</Eyebrow>
              <h2 id="quick-view-title">{selectedDrink.name}</h2>
              <p>{selectedDrink.note}. Prepared fresh to order.</p>
              <div className="quick-view-bottom">
                <span className="quick-view-price">{selectedDrink.price}</span>
                <button
                  className="button button-dark"
                  onClick={() => {
                    addToBag(selectedDrink.name);
                    setSelectedDrink(null);
                  }}
                  type="button"
                >
                  Add to your bag <Plus size={17} />
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
      <span className="visually-hidden" aria-live="polite">{cartCount} items in your bag</span>
    </main>
  );
}

export default App;
