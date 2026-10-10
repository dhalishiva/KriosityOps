type Props = { size?: number; wordmark?: boolean; className?: string };

/** The mark is a tiny status board: three apps, two healthy, one due. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" fill="#14213D" />
      <circle cx="9.5" cy="10" r="2.4" fill="#16A36A" />
      <rect x="14" y="8.6" width="11" height="2.8" rx="1.4" fill="#FFFFFF" />
      <circle cx="9.5" cy="16" r="2.4" fill="#16A36A" />
      <rect x="14" y="14.6" width="8" height="2.8" rx="1.4" fill="#FFFFFF" />
      <circle cx="9.5" cy="22" r="2.4" fill="#F5A524" />
      <rect x="14" y="20.6" width="10" height="2.8" rx="1.4" fill="#FFFFFF" />
    </svg>
  );
}

export function Logo({ size = 28, wordmark = true, className }: Props) {
  return (
    <span className={`logo ${className ?? ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <LogoMark size={size} />
      {wordmark && (
        <span style={{ fontWeight: 700, fontSize: size * 0.68, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
          KriosityOps
        </span>
      )}
    </span>
  );
}
