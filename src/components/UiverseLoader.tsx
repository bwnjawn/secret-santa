interface UiverseLoaderProps {
  label?: string;
  overlay?: boolean;
}

export function UiverseLoader({ label, overlay = false }: UiverseLoaderProps) {
  const content = (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-[#6b2e1b]/95 px-8 py-6 text-white shadow-2xl ring-1 ring-white/15"
    >
      <div className="uiverse-loader-wrapper" aria-hidden="true">
        <div className="uiverse-loader-circle" />
        <div className="uiverse-loader-circle" />
        <div className="uiverse-loader-circle" />
        <div className="uiverse-loader-shadow" />
        <div className="uiverse-loader-shadow" />
        <div className="uiverse-loader-shadow" />
      </div>
      {label && <p className="text-sm font-semibold tracking-wide text-amber-50">{label}</p>}
    </div>
  );

  if (!overlay) {
    return <div className="flex items-center justify-center py-8">{content}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs">
      {content}
    </div>
  );
}
