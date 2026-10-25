import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = { title: "Our story" };

export default function AboutPage() {
  return (
    <main className="subpage about-page">
      <section className="subpage-heading">
        <p className="eyebrow">About Goodkind</p>
        <h1>A neighborhood<br />coffee <em>shop.</em></h1>
        <p>Independent, locally minded, and here on Orchard Street.</p>
      </section>
      <section className="about-story-grid">
        <div className="about-story-image">
          <img alt="A barista making coffee by hand" decoding="async" loading="lazy" src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=68" />
        </div>
        <div className="about-story-copy">
          <p className="eyebrow">Our approach</p>
          <h2>Good coffee.<br /><em>Good neighbors.</em></h2>
          <p>Goodkind began with a simple idea: make a welcoming neighborhood café and take the coffee seriously without taking ourselves too seriously.</p>
          <p>We work with independent roasters, source seasonal ingredients, and bake in small batches. The menu changes as the seasons do; the welcome stays the same.</p>
          <p>Whether you’re stopping for an espresso or settling in with a book, there’s room at the table.</p>
          <Link className="text-link" href="/find-us">Find the café <ArrowRight size={16} /></Link>
        </div>
      </section>
      <section className="about-note">
        <p className="eyebrow">The details matter</p>
        <h2>Thoughtfully sourced.<br /><em>Made here.</em></h2>
      </section>
    </main>
  );
}
