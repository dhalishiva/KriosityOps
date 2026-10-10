import type { ReactNode } from 'react';
import { ago, freshness, platformLabel } from '../lib/catalog';

export type ChannelItem = {
  id: string;
  platform: string;
  handle: string | null;
  cadence: number;
  lastPostedAt: string | null;
  lastLinks: string[];
  postCount: number;
};

type Props = {
  items: ChannelItem[];
  now?: number;
  action?: (c: ChannelItem) => ReactNode;
  onOpen?: (c: ChannelItem) => void;
};

const stateText = { ok: 'On schedule', due: 'Due', late: 'Overdue', never: 'Not started' } as const;

export function ChannelList({ items, now = Date.now(), action, onOpen }: Props) {
  return (
    <ul className="chan">
      {items.map((c) => {
        const f = freshness(c.lastPostedAt, c.cadence, now);
        return (
          <li key={c.id} className={`chan-row chan-${f.state}`}>
            <span className={`lamp lamp-${f.state}`} aria-hidden="true" />
            <span className="chan-main">
              {onOpen ? (
                <button type="button" className="chan-name linklike" onClick={() => onOpen(c)}>
                  {platformLabel(c.platform)}
                  {c.handle && <span className="chan-handle"> {c.handle}</span>}
                </button>
              ) : (
                <span className="chan-name">
                  {platformLabel(c.platform)}
                  {c.handle && <span className="chan-handle"> {c.handle}</span>}
                </span>
              )}
              <span className="chan-meta">
                {ago(f.days)} <span aria-hidden="true">/</span> every {c.cadence} {c.cadence === 1 ? 'day' : 'days'}
                {c.postCount > 0 && <> <span aria-hidden="true">/</span> {c.postCount} {c.postCount === 1 ? 'post' : 'posts'}</>}
              </span>
              {c.lastLinks[0] && (
                <a className="chan-link" href={c.lastLinks[0]} target="_blank" rel="noopener noreferrer">
                  {c.lastLinks[0].replace(/^https?:\/\/(www\.)?/, '').slice(0, 48)}
                </a>
              )}
            </span>
            <span className={`chan-state chan-state-${f.state}`}>{stateText[f.state]}</span>
            {action && <span className="chan-action">{action(c)}</span>}
          </li>
        );
      })}
    </ul>
  );
}
