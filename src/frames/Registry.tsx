import type { ReactNode } from 'react';
import { kindLabel } from '../lib/catalog';

export type RegistryItem = {
  id: string;
  kind: string;
  provider: string;
  account: string | null;
  project: string | null;
  link: string | null;
  notes: string | null;
};

type Props = {
  items: RegistryItem[];
  actions?: (item: RegistryItem) => ReactNode;
};

export function RegistryTable({ items, actions }: Props) {
  return (
    <div className="reg" role="table" aria-label="Where this app lives">
      <div className="reg-head" role="row">
        <span role="columnheader">Type</span>
        <span role="columnheader">Provider</span>
        <span role="columnheader">Account</span>
        <span role="columnheader">Project</span>
        <span role="columnheader" aria-label="Actions" />
      </div>
      {items.map((it) => (
        <div className="reg-row" role="row" key={it.id}>
          <span role="cell" className="reg-kind">{kindLabel(it.kind)}</span>
          <span role="cell" className="reg-provider">{it.provider}</span>
          <span role="cell" className="reg-account">{it.account || <span className="board-muted">—</span>}</span>
          <span role="cell" className="reg-project">
            {it.project ? (
              it.link ? (
                <a className="mono" href={it.link} target="_blank" rel="noopener noreferrer">
                  {it.project}
                </a>
              ) : (
                <span className="mono">{it.project}</span>
              )
            ) : (
              <span className="board-muted">—</span>
            )}
            {it.notes && <span className="reg-notes">{it.notes}</span>}
          </span>
          <span role="cell" className="reg-actions">{actions?.(it)}</span>
        </div>
      ))}
    </div>
  );
}
