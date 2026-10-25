type DashboardPlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export default function DashboardPlaceholderPage({
  eyebrow,
  title,
  description,
}: DashboardPlaceholderPageProps) {
  return (
    <section className="rounded-[28px] border border-dashed border-outline bg-surface-container-lowest p-8 shadow-level-1">
      <span className="inline-flex rounded-full border border-outline-variant bg-surface-container px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
        {eyebrow}
      </span>
      <h2 className="mt-5 text-2xl font-bold tracking-tight text-on-background">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant">
        {description}
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          "Shared dashboard shell applied",
          "Navigation route available",
          "Feature content can be integrated here",
        ].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-outline-variant bg-surface-container p-4 text-sm font-medium text-on-background"
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
