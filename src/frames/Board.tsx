import { ago, freshness, platformLabel, type Freshness } from '../lib/catalog';
import type { BoardRow } from '../lib/types';

const rank: Record<Freshness, number> = { ok: 0, never: 1, due: 2, late: 3 };

export function worstSocial(row: BoardRow, now = Date.now()) {
  let worst: { platform: string; state: Freshness; days: number | null } | null = null;
  for (const s of row.social) {
    const f = freshness(s.lastPostedAt, s.cadence, now);
    if (!worst || rank[f.state] > rank[worst.state]) worst = { platform: s.platform, ...f };
  }
  return worst;
}

const fmt = (n: number | null) => (n === null ? '—' : n.toLocaleString('en-IN'));

function shortRef(p: string | null) {
  if (!p) return '';
  return p.length > 14 ? p.slice(0, 12) + '…' : p;
}

type Props = {
  rows: BoardRow[];
  now?: number;
  onOpen?: (id: string) => void;
  animate?: boolean;
  caption?: string;
};

export function Board({ rows, now = Date.now(), onOpen, animate, caption }: Props) {
  return (
    <div className={`board ${animate ? 'board-animate' : ''}`} role="table" aria-label={caption ?? 'Your apps'}>
      <div className="board-head" role="row">
        <span role="columnheader">App</span>
        <span role="columnheader">Lives on</span>
        <span role="columnheader">Last post</span>
        <span role="columnheader" className="board-num">New / total users</span>
      </div>
      {rows.map((r, i) => {
        const w = worstSocial(r, now);
        const state = w?.state ?? 'never';
        const Row = onOpen ? 'button' : 'div';
        return (
          <Row
            key={r.app.id}
            role="row"
            className="board-row"
            style={{ ['--i' as string]: i }}
            {...(onOpen ? { type: 'button', onClick: () => onOpen(r.app.id) } : {})}
          >
            <span role="cell" className="board-app">
              <span className="board-swatch" style={{ background: r.app.color }} aria-hidden="true" />
              <span className="board-name">
                <strong>{r.app.name}</strong>
                {r.app.in_use_by ? (
                  <span className="board-lock" title={`Being worked on by ${r.app.in_use_by}`}>
                    <LockIcon /> {r.app.in_use_by} is working on it
                  </span>
                ) : (
                  <span className="board-url">{r.app.url ? r.app.url.replace(/^https?:\/\//, '') : r.app.status}</span>
                )}
              </span>
            </span>
            <span role="cell" className="board-stack">
              {r.stack.length === 0 && <span className="board-muted">Nothing recorded yet</span>}
              {r.stack.slice(0, 3).map((s, j) => (
                <span key={j} className="chip">
                  {s.provider}
                  {s.project && <span className="mono chip-ref">{shortRef(s.project)}</span>}
                </span>
              ))}
              {r.stack.length > 3 && <span className="chip chip-more">+{r.stack.length - 3}</span>}
            </span>
            <span role="cell" className="board-social">
              <span className={`lamp lamp-${state}`} aria-hidden="true" />
              {w ? (
                <span>
                  {platformLabel(w.platform)} <span className="board-muted">{ago(w.days)}</span>
                  <span className="visually-hidden">{state === 'ok' ? ', on schedule' : state === 'due' ? ', due' : state === 'late' ? ', overdue' : ''}</span>
                </span>
              ) : (
                <span className="board-muted">No channels</span>
              )}
            </span>
            <span role="cell" className="board-num">
              <strong>{r.usersNew === null ? '—' : `+${fmt(r.usersNew)}`}</strong>
              <span className="board-muted"> / {fmt(r.usersTotal)}</span>
            </span>
          </Row>
        );
      })}
    </div>
  );
}

export function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
    </svg>
  );
}
