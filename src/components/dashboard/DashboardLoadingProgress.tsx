type DashboardLoadingProgressProps = {
  label: string;
};

export default function DashboardLoadingProgress({
  label,
}: DashboardLoadingProgressProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="dashboard-loading-overlay fixed inset-0 z-[100] grid place-items-center bg-white/55 px-4 backdrop-blur-[2px]"
    >
      <div className="flex items-center gap-4 rounded-2xl border border-white/80 bg-white/85 px-5 py-4 shadow-xl backdrop-blur-md">
        <svg
          className="size-10 shrink-0 animate-spin text-primary"
          viewBox="0 0 40 40"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="20"
            cy="20"
            r="16"
            stroke="currentColor"
            strokeOpacity="0.16"
            strokeWidth="4"
          />
          <path
            d="M20 4a16 16 0 0 1 16 16"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="4"
          />
        </svg>
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      </div>
    </div>
  );
}
