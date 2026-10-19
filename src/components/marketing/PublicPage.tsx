import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FadeIn from "@/components/animations/FadeIn";

export const primaryAction =
  "inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary";
export const secondaryAction =
  "inline-flex items-center justify-center rounded-lg border border-outline-variant px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary";

export default function PublicPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only z-[60] rounded-lg bg-primary px-4 py-2 text-on-primary focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 pt-[72px]">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export function PublicHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-[1200px] px-6 pb-10 pt-16 text-center md:pt-20">
      <FadeIn>
        <span className="mb-6 inline-block rounded-full border border-outline-variant bg-surface-container-high px-3 py-1 text-xs font-semibold uppercase tracking-wide text-on-surface">
          {eyebrow}
        </span>
        <h1 className="mx-auto mb-6 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-on-background md:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mx-auto max-w-3xl text-lg leading-relaxed text-on-surface-variant">
          {description}
        </p>
        {children && (
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {children}
          </div>
        )}
      </FadeIn>
    </section>
  );
}

export function PublicSection({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="mx-auto max-w-[1200px] scroll-mt-24 px-6 py-12 md:py-16"
    >
      <FadeIn>
        <h2 className="mb-4 text-center text-2xl font-bold text-on-background md:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="mx-auto mb-10 max-w-2xl text-center text-sm leading-relaxed text-on-surface-variant">
            {description}
          </p>
        )}
      </FadeIn>
      <div className={description ? "" : "mt-8"}>{children}</div>
    </section>
  );
}

type Feature = {
  id?: string;
  icon: LucideIcon;
  title: string;
  description: string;
  features?: string[];
};
export function PublicCards({
  items,
  detailed = false,
}: {
  items: readonly Feature[];
  detailed?: boolean;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {items.map(({ icon: Icon, ...item }, i) => (
        <article
          id={detailed ? item.id : undefined}
          key={item.title}
          className="h-full scroll-mt-24 rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-level-1"
        >
          <FadeIn delay={i * 0.025}>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-low text-primary">
              <Icon size={21} aria-hidden="true" />
            </div>
            <h3 className="mb-3 text-base font-semibold text-on-background">
              {item.title}
            </h3>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              {item.description}
            </p>
            {detailed && item.features && (
              <ul className="mt-5 list-disc space-y-2 border-t border-outline-variant pl-4 pt-4 text-sm text-on-surface-variant">
                {item.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            )}
          </FadeIn>
        </article>
      ))}
    </div>
  );
}

export function PublicCta() {
  return (
    <PublicSection
      title="Bring your construction work into one workspace"
      description="Create an account or sign in to access the modules available to your role."
    >
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/register" className={primaryAction}>
          Create an account
        </Link>
        <Link href="/login" className={secondaryAction}>
          Sign in
        </Link>
      </div>
    </PublicSection>
  );
}
