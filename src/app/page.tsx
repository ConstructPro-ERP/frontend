import Image from "next/image";
import Link from "next/link";
import BackendWarmup from "@/components/BackendWarmup";
import PublicPage, {
  PublicCards,
  PublicCta,
  PublicHero,
  PublicSection,
  primaryAction,
  secondaryAction,
} from "@/components/marketing/PublicPage";
import {
  publicModules,
  publicSecurity,
  publicWorkflow,
} from "@/lib/publicContent";
import dashboardPreview from "../../public/images/dashboard-preview.png";

export default function HomePage() {
  return (
    <PublicPage>
      <BackendWarmup />
      <PublicHero
        eyebrow="Construction operations"
        title="From the first inquiry to the final payment"
        description="Manage leads, quotations, project work, documents, and payments in ConstructPro. Review business performance and project risk from a shared dashboard."
      >
        <Link href="/register" className={primaryAction}>
          Create an account
        </Link>
        <Link href="#dashboard-preview" className={secondaryAction}>
          See dashboard preview
        </Link>
      </PublicHero>

      <section
        id="dashboard-preview"
        aria-label="Dashboard preview"
        className="mx-auto max-w-[1248px] scroll-mt-24 px-6 py-8"
      >
        <figure className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-level-2">
          <div className="relative flex h-11 items-center border-b border-outline-variant bg-surface-container px-4">
            <div aria-hidden="true" className="flex gap-2">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>
            <span className="pointer-events-none absolute inset-x-20 text-center text-xs font-medium text-on-surface-variant">
              ConstructPro · Dashboard
            </span>
          </div>
          <Image
            src={dashboardPreview}
            alt="ConstructPro dashboard with five sample projects, revenue, lead and payment summaries, and project status charts"
            unoptimized
            sizes="(max-width: 1248px) calc(100vw - 48px), 1200px"
            className="h-auto w-full"
          />
        </figure>
      </section>

      <PublicSection
        id="workflow"
        title="Follow the work from lead to payment"
        description="Keep the sales, project, and finance stages connected through the records your team manages."
      >
        <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {publicWorkflow.map((step, i) => (
            <li
              key={step.title}
              className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-level-1"
            >
              <span className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                {i + 1}
              </span>
              <h3 className="mb-3 font-semibold text-on-background">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
        <div className="mt-8 text-center">
          <Link href="/workflow" className={secondaryAction}>
            Explore the workflow
          </Link>
        </div>
      </PublicSection>

      <PublicSection
        id="modules"
        title="Tools for the work you manage"
        description="Explore the modules and project tools available in the application. Access depends on your role."
      >
        <PublicCards items={publicModules} />
        <div className="mt-8 text-center">
          <Link href="/modules" className={secondaryAction}>
            Explore all modules
          </Link>
        </div>
      </PublicSection>

      <PublicSection
        id="security"
        title="Access for your team"
        description="Account authentication, permission checks, and project assignment rules control access to protected operations."
      >
        <PublicCards items={publicSecurity.slice(1)} />
        <div className="mt-8 text-center">
          <Link href="/security" className={secondaryAction}>
            Read about access controls
          </Link>
        </div>
      </PublicSection>

      <section id="analytics" className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="rounded-2xl bg-hero px-6 py-12 text-center sm:px-12">
          <h2 className="mb-4 text-2xl font-bold text-on-hero md:text-3xl">
            Understand performance and project risk
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-sm leading-relaxed text-on-hero-muted">
            Review revenue trends, project progress, and overdue invoices.
            Explore AI project risk assessments and the context behind them to
            support your team&apos;s decisions.
          </p>
          <Link
            href="/modules#analytics"
            className="inline-flex rounded-lg bg-on-hero px-6 py-3 text-sm font-semibold text-hero transition-colors hover:bg-hero-surface focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-on-hero"
          >
            Explore analytics & AI
          </Link>
        </div>
      </section>
      <PublicCta />
    </PublicPage>
  );
}
