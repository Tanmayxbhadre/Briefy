interface AdSlotProps {
  id: string;
  width: number;
  height: number;
  label?: string;
  className?: string;
  active?: boolean;
}

/**
 * AdSlot — Reserved space for Google AdSense or sponsor integration.
 * When inactive (default), collapses completely to prevent blank dashed voids
 * and eliminate Cumulative Layout Shift (CLS).
 */
export default function AdSlot({
  id,
  width,
  height,
  label = 'Advertisement',
  className,
  active = false,
}: AdSlotProps) {
  if (!active) {
    return null;
  }

  const clampedHeight = Math.min(height, 90);
  return (
    <aside
      id={id}
      className={`ad-slot ${className ?? ''}`}
      style={{
        width: '100%',
        maxWidth: width,
        maxHeight: clampedHeight,
        margin: '0 auto',
      }}
      aria-label={label}
    >
      <span className="ad-label" aria-hidden="true">{label}</span>
    </aside>
  );
}
