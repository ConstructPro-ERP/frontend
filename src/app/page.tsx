// src/app/page.tsx
import FadeIn from "@/components/animations/FadeIn";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  Eye,
  Network,
  Users,
  Bot,
  ContactRound,
  FileText,
  HardHat,
  Wallet,
  LayoutDashboard,
  UserCircle,
  Folder,
  PackageSearch,
  BarChart2,
  Settings,
  ShieldCheck,
  Wrench,
  Landmark,
  Headset,
  UserCheck,
  ClipboardCheck,
  ArrowRight,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const platformFeatures = [
  {
    icon: Eye,
    title: "Operational Visibility",
    description:
      "Real-time insights across all active projects, financial metrics, and operational bottlenecks.",
  },
  {
    icon: Network,
    title: "Lead-to-Project Lifecycle",
    description:
      "Seamlessly transition from initial client lead to finalized quotation and active project execution.",
  },
  {
    icon: Users,
    title: "Department Collaboration",
    description:
      "Unify sales, project management, and finance teams with shared data and automated handoffs.",
  },
  {
    icon: Bot,
    title: "AI-Assisted Decision Making",
    description:
      "Leverage predictive analytics to identify potential delays, budget overruns, and resource constraints early.",
  },
];

const workflowSteps = [
  {
    icon: ContactRound,
    step: "1",
    title: "Leads & CRM",
    description:
      "Capture and manage inquiries, track communications, and monitor lead conversion rates.",
  },
  {
    icon: FileText,
    step: "2",
    title: "Quotations",
    description:
      "Generate accurate BOQs, send for client approval, and transition seamlessly to projects.",
  },
  {
    icon: HardHat,
    step: "3",
    title: "Project Execution",
    description:
      "Track milestones, assign resources, and monitor real-time progress against timelines.",
  },
  {
    icon: Wallet,
    step: "4",
    title: "Finance & Invoicing",
    description:
      "Automate billing linked to milestones, track incoming payments, and manage cash flow.",
  },
];

const modules = [
  {
    icon: LayoutDashboard,
    title: "Executive Dashboard",
    description:
      "High-level KPIs, revenue tracking, and global project status overviews.",
  },
  {
    icon: UserCircle,
    title: "Client Portal",
    description:
      "Secure access for clients to view project progress, approve quotes, and pay invoices.",
  },
  {
    icon: Folder,
    title: "Document Management",
    description:
      "Centralised storage for blueprints, permits, contracts, and compliance records.",
  },
  {
    icon: PackageSearch,
    title: "Resource Planning",
    description:
      "Allocate equipment, track material usage, and schedule labour across multiple sites.",
  },
  {
    icon: BarChart2,
    title: "Advanced Reporting",
    description:
      "Custom report generation for financial audits, productivity analysis, and safety compliance.",
  },
  {
    icon: Settings,
    title: "System Configuration",
    description:
      "Custom workflows, notification triggers, and integration settings for third-party tools.",
  },
];

const roles = [
  {
    icon: ShieldCheck,
    title: "Administrator",
    badge: "Full Access",
    description:
      "System configuration, user management, and global audit logs.",
  },
  {
    icon: Wrench,
    title: "Project Manager",
    badge: "Projects & Teams",
    description:
      "Milestone tracking, resource allocation, and daily site reporting.",
  },
  {
    icon: Landmark,
    title: "Finance Officer",
    badge: "Billing & Expenses",
    description:
      "Invoice generation, payment reconciliation, and budget monitoring.",
  },
  {
    icon: Headset,
    title: "Sales Executive",
    badge: "Leads & Quotes",
    description:
      "Lead nurturing, quotation drafting, and client communication.",
  },
  {
    icon: UserCheck,
    title: "Client",
    badge: "Read-Only",
    description:
      "View assigned project status, approve documents, and access invoices.",
  },
  {
    icon: ClipboardCheck,
    title: "Auditor",
    badge: "Reporting",
    description:
      "Access to historical data, financial summaries, and compliance logs.",
  },
];

// ─── Page (Server Component) ───────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pt-[72px]">
        {/* Hero */}
        <section
          id="overview"
          className="max-w-[1600px] mx-auto px-6 py-20 flex flex-col items-center text-center"
        >
          <FadeIn>
            <span className="inline-block bg-surface-container-high text-on-surface text-xs font-semibold px-3 py-1 rounded-full border border-outline-variant mb-6 tracking-wide uppercase">
              Construction Operations Platform
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-on-background leading-tight tracking-tight max-w-4xl mx-auto mb-6">
              Centralised Construction Operations from{" "}
              <span className="text-primary">Lead to Project Completion</span>
            </h1>
            <p className="text-lg text-on-surface-variant max-w-3xl mx-auto mb-12 leading-relaxed">
              ConstructPro ERP unifies leads, quotations, projects, finance,
              documents, analytics, and AI-powered risk prediction into a single
              secure platform designed for construction operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                type="button"
                className="bg-primary text-on-primary font-semibold px-8 py-3 rounded-lg hover:bg-primary-hover transition-colors text-sm"
              >
                Get Started Free
              </button>
              <button
                type="button"
                className="text-primary font-semibold px-8 py-3 rounded-lg border border-outline-variant hover:bg-surface-container transition-colors text-sm"
              >
                View Demo
              </button>
            </div>
          </FadeIn>
        </section>

        {/* Dashboard Preview */}
        <section className="max-w-[1600px] mx-auto px-6 py-16 flex justify-center">
          <FadeIn delay={0.15} className="w-full max-w-[1200px]">
            <div className="w-full rounded-xl shadow-level-2 bg-surface-container-lowest overflow-hidden border border-outline-variant">
              <div className="bg-surface-container h-8 flex items-center px-4 gap-2">
                <span className="w-3 h-3 rounded-full bg-risk-high" />
                <span className="w-3 h-3 rounded-full bg-risk-medium" />
                <span className="w-3 h-3 rounded-full bg-risk-low" />
              </div>
              <div className="bg-surface-container-low h-64 md:h-96 flex items-center justify-center text-on-surface-variant">
                <div className="text-center">
                  <LayoutDashboard
                    size={48}
                    className="mx-auto mb-4 text-outline-variant"
                  />
                  <p className="text-sm font-medium">Dashboard Preview</p>
                  <p className="text-xs text-outline mt-1">
                    Screenshot coming soon
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* Platform Overview */}
        <section className="max-w-[1600px] mx-auto px-6 py-16">
          <FadeIn>
            <h2 className="text-2xl md:text-3xl font-bold text-center text-on-background mb-12">
              One Platform. Complete Operational Visibility.
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {platformFeatures.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <FadeIn key={feature.title} delay={i * 0.08}>
                  <div className="bg-surface-container-lowest rounded-xl p-6 shadow-level-1 border border-outline-variant h-full">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center mb-4">
                      <Icon size={20} className="text-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-on-background mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </section>

        {/* Workflow */}
        <section id="workflow" className="max-w-[1600px] mx-auto px-6 py-16">
          <FadeIn>
            <h2 className="text-2xl md:text-3xl font-bold text-center text-on-background mb-12">
              Unified Operations Lifecycle
            </h2>
          </FadeIn>
          <div className="flex flex-col lg:flex-row gap-5 items-stretch">
            {workflowSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.step}
                  className="flex flex-col lg:flex-row items-center gap-5 flex-1"
                >
                  <FadeIn delay={i * 0.1} className="flex-1 w-full">
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-level-1 h-full">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center">
                          <Icon size={18} className="text-primary" />
                        </div>
                        <h4 className="text-base font-semibold text-on-background">
                          {step.step}. {step.title}
                        </h4>
                      </div>
                      <p className="text-sm text-on-surface-variant leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </FadeIn>
                  {i < workflowSteps.length - 1 && (
                    <ArrowRight
                      size={20}
                      className="text-outline shrink-0 hidden lg:block"
                      aria-hidden="true"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Modules */}
        <section
          id="modules"
          className="max-w-[1600px] mx-auto px-6 py-16 bg-surface-container-low rounded-2xl"
        >
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-on-background mb-4">
                Comprehensive Module Suite
              </h2>
              <p className="text-sm text-on-surface-variant max-w-2xl mx-auto">
                Everything you need to run your construction business
                efficiently, integrated into one core platform.
              </p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <FadeIn key={mod.title} delay={i * 0.07}>
                  <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-level-1 h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
                        <Icon size={20} className="text-primary" />
                      </div>
                      <h4 className="text-base font-semibold text-on-background">
                        {mod.title}
                      </h4>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      {mod.description}
                    </p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </section>

        {/* Role Access */}
        <section className="max-w-[1600px] mx-auto px-6 py-16">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-on-background mb-4">
                Role-Based Access Control
              </h2>
              <p className="text-sm text-on-surface-variant max-w-2xl mx-auto">
                Secure, customised environments tailored to the specific
                responsibilities of each team member.
              </p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {roles.map((role, i) => {
              const Icon = role.icon;
              return (
                <FadeIn key={role.title} delay={i * 0.07}>
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-level-1 flex items-start gap-4 h-full">
                    <Icon
                      size={22}
                      className="text-on-surface-variant shrink-0 mt-0.5"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="text-sm font-semibold text-on-background">
                          {role.title}
                        </h5>
                        <span className="bg-surface-container text-on-surface-variant text-[10px] px-2 py-0.5 rounded-full font-medium border border-outline-variant">
                          {role.badge}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {role.description}
                      </p>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </section>

        {/* AI Risk Prediction */}
        <section
          id="security"
          className="max-w-[1600px] mx-auto px-6 py-16 mb-12"
        >
          <FadeIn>
            <div className="bg-hero rounded-2xl p-12 text-center overflow-hidden relative">
              <span className="inline-block bg-on-hero/10 text-on-hero text-xs font-semibold px-3 py-1 rounded-full border border-on-hero/20 mb-6 tracking-wide uppercase">
                Powered by RAG · LangChain
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-on-hero mb-4">
                AI-Powered Risk Prediction
              </h2>
              <p className="text-sm text-on-hero-muted max-w-2xl mx-auto mb-8 leading-relaxed">
                Proactively manage construction risks with advanced AI models
                analysing historical data, payment patterns, and milestone
                velocity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  type="button"
                  className="bg-on-hero text-hero font-semibold px-8 py-3 rounded-lg hover:bg-hero-surface transition-colors text-sm"
                >
                  Explore AI Features
                </button>
                <button
                  type="button"
                  className="bg-on-hero/10 text-on-hero font-semibold px-8 py-3 rounded-lg border border-on-hero/20 hover:bg-on-hero/20 transition-colors text-sm"
                >
                  Learn More
                </button>
              </div>
            </div>
          </FadeIn>
        </section>
      </main>
      <Footer />
    </div>
  );
}
