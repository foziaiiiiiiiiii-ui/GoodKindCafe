import type { Metadata } from "next";
import { ArrowUpRight, Clock3, MapPin, Phone } from "lucide-react";

export const metadata: Metadata = { title: "Find us" };
const hours = [
  ["Monday – Friday", "7:30 am – 5 pm"],
  ["Saturday", "8 am – 5 pm"],
  ["Sunday", "8 am – 3 pm"],
];

export default function FindUsPage() {
  const mapUrl = "https://maps.google.com/?q=18+Orchard+Street+New+York+NY+10002";
  return (
    <main className="subpage find-page">
      <section className="subpage-heading">
        <p className="eyebrow">18 Orchard Street · New York</p>
        <h1>Find <em>Goodkind.</em></h1>
        <p>Lower East Side, Manhattan.</p>
      </section>
      <section className="find-grid">
        <div className="find-details">
          <div className="find-detail">
            <span className="find-icon"><MapPin size={19} /></span>
            <div><h2>Address</h2><p>18 Orchard Street<br />New York, NY 10002</p>
              <a className="text-link" href={mapUrl} rel="noreferrer" target="_blank">Open directions <ArrowUpRight size={15} /></a>
            </div>
          </div>
          <div className="find-detail">
            <span className="find-icon"><Clock3 size={19} /></span>
            <div className="find-hours"><h2>Opening hours</h2>
              {hours.map(([day, time]) => <div className="hours-row" key={day}><span>{day}</span><span>{time}</span></div>)}
            </div>
          </div>
          <div className="find-detail">
            <span className="find-icon"><Phone size={19} /></span>
            <div><h2>Get in touch</h2><a href="tel:+12125550184">+1 (212) 555-0184</a><br /><a href="mailto:hello@goodkind.coffee">hello@goodkind.coffee</a></div>
          </div>
        </div>
        <a aria-label="Open directions to Goodkind in Google Maps" className="find-photo" href={mapUrl} rel="noreferrer" target="_blank">
          <img alt="Interior of a neighborhood café" decoding="async" loading="lazy" src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1000&q=68" />
          <span className="find-map-link">Open map <ArrowUpRight size={15} /></span>
        </a>
      </section>
    </main>
  );
}
