import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { WhatsAppBubble } from '../components/WhatsAppBubble';
import { SITE } from '../lib/config';

// Login and signup open in a new tab so the marketing page stays where the reader left it.
export const newTab = { target: '_blank', rel: 'noopener' } as const;

export function MarketingLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mk">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="mk-nav">
        <div className="mk-wrap mk-nav-inner">
          <Link to="/" aria-label="KriosityOps home">
            <Logo size={28} />
          </Link>
          <nav className={`mk-links ${open ? 'is-open' : ''}`} aria-label="Main">
            <a href="/#registry" onClick={() => setOpen(false)}>Features</a>
            <NavLink to="/pricing" onClick={() => setOpen(false)}>Pricing</NavLink>
            <NavLink to="/contact" onClick={() => setOpen(false)}>Contact</NavLink>
            <a className="mk-login" href="/login" {...newTab}>Log in</a>
            <a className="btn btn-primary btn-sm" href="/signup" {...newTab}>Start free</a>
          </nav>
          <button className="mk-burger" type="button" aria-expanded={open} aria-label="Menu" onClick={() => setOpen(!open)}>
            <span />
            <span />
          </button>
        </div>
      </header>
      <main id="main">{children}</main>
      <footer className="mk-foot">
        <div className="mk-wrap mk-foot-inner">
          <div className="mk-foot-brand">
            <Logo size={24} />
            <p>
              A <a href={SITE.parentUrl}>Kriosity</a> product. Made in Noida for founders who ship more than one thing.
            </p>
          </div>
          <nav className="mk-foot-links" aria-label="Footer">
            <div>
              <h2>Product</h2>
              <a href="/#registry">Features</a>
              <Link to="/pricing">Pricing</Link>
              <a href="/signup" {...newTab}>Create an account</a>
              <a href="/login" {...newTab}>Log in</a>
            </div>
            <div>
              <h2>Company</h2>
              <Link to="/contact">Contact</Link>
              <a href={SITE.parentUrl}>Kriosity</a>
              <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>
            </div>
            <div>
              <h2>Legal</h2>
              <Link to="/privacy">Privacy</Link>
              <Link to="/terms">Terms</Link>
              <Link to="/refund">Refunds and cancellation</Link>
            </div>
          </nav>
        </div>
        <div className="mk-wrap mk-legal">© 2026 {SITE.company}. KriosityOps is operated by {SITE.company}, Noida, India.</div>
      </footer>
      <WhatsAppBubble />
    </div>
  );
}

/** A product screenshot frame: the real app header around real app UI. */
export function Frame({ path, children, className }: { path: string; children: ReactNode; className?: string }) {
  return (
    <figure className={`frame ${className ?? ''}`}>
      <div className="frame-bar" aria-hidden="true">
        <span className="frame-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="frame-url">ops.kriosity.in{path}</span>
      </div>
      <div className="frame-body">{children}</div>
    </figure>
  );
}
