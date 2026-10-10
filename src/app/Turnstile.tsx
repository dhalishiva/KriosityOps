import { useEffect, useRef } from 'react';
import { ENV } from '../lib/config';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/** Renders Cloudflare Turnstile when a site key is configured; otherwise renders nothing. */
export function Turnstile({ onToken, resetKey }: { onToken: (t: string | null) => void; resetKey?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const idRef = useRef<string>();

  useEffect(() => {
    if (!ENV.turnstileSiteKey || !ref.current) return;
    let cancelled = false;
    const mount = () => {
      if (cancelled || !ref.current || !window.turnstile) return;
      idRef.current = window.turnstile.render(ref.current, {
        sitekey: ENV.turnstileSiteKey,
        callback: (t: string) => onToken(t),
        'expired-callback': () => onToken(null),
        'error-callback': () => onToken(null),
        theme: 'light',
      });
    };
    if (window.turnstile) mount();
    else {
      let s = document.querySelector<HTMLScriptElement>(`script[src="${SRC}"]`);
      if (!s) {
        s = document.createElement('script');
        s.src = SRC;
        s.async = true;
        document.head.appendChild(s);
      }
      s.addEventListener('load', mount);
    }
    return () => {
      cancelled = true;
      if (idRef.current) window.turnstile?.remove(idRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  if (!ENV.turnstileSiteKey) return null;
  return <div ref={ref} className="turnstile" />;
}

export const captchaRequired = () => Boolean(ENV.turnstileSiteKey);
