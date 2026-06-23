// src/app/workflow/page.tsx
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FadeIn from "@/components/animations/FadeIn";
import {
  UserPlus,
  FileText,
  FileCheck,
  HardHat,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "Workflow Architecture - ConstructPro ERP",
  description:
    "A unified operational ecosystem designed for the modern builder.",
};

const workflowSteps = [
  {
    num: "1",
    icon: UserPlus,
    title: "Lead Intake",
    description:
      "Omni-channel capture with AI-driven qualification and automated routing.",
  },
  {
    num: "2",
    icon: FileText,
    title: "Precision Quote",
    description:
      "Intelligent material takeoff and historical data analysis for accurate bids.",
  },
  {
    num: "3",
    icon: FileCheck,
    title: "Contract Execution",
    description:
      "Digital signatures and automated compliance verification for faster starts.",
  },
  {
    num: "4",
    icon: HardHat,
    title: "Active Production",
    description:
      "Real-time site management, field logs, and schedule synchronization.",
  },
  {
    num: "5",
    icon: CheckCircle2,
    title: "Closeout",
    description:
      "Automated punch lists, warranty activation, and archival of project records.",
  },
];

export default function WorkflowPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pt-[72px]">
        {/* Hero */}
        <section className="max-w-[1600px] mx-auto px-6 py-20 flex flex-col items-center text-center">
          <FadeIn>
            <span className="inline-block bg-surface-container-high text-on-surface text-xs font-semibold px-3 py-1 rounded-full border border-outline-variant mb-6 tracking-wide uppercase">
              Process Innovation
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-on-background leading-tight tracking-tight max-w-4xl mx-auto mb-6">
              Lifecycle <span className="text-primary">Architecture</span>
            </h1>
            <p className="text-lg text-on-surface-variant max-w-3xl mx-auto mb-12 leading-relaxed">
              A unified operational ecosystem designed for the modern builder.
              From initial contact to final closeout, every phase is
              orchestrated with precision and automated for scale.
            </p>
          </FadeIn>
        </section>

        {/* Workflow Diagram */}
        <section className="max-w-[1600px] mx-auto px-6 py-16 bg-surface-container-low rounded-2xl mb-12">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-on-background mb-4">
                Unified Operations Lifecycle
              </h2>
            </div>
          </FadeIn>
          <div className="flex flex-col lg:flex-row gap-5 items-stretch">
            {workflowSteps.map((step, i) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.num}
                  className="flex flex-col lg:flex-row items-center gap-5 flex-1"
                >
                  <FadeIn delay={i * 0.1} className="flex-1 w-full h-full">
                    <div className="p-6 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-background shadow-level-1 h-full transition-colors">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center">
                          <Icon size={18} className="text-primary" />
                        </div>

                        <h4 className="text-base font-semibold">
                          {step.num}. {step.title}
                        </h4>
                      </div>

                      <p className="text-sm leading-relaxed text-on-surface-variant">
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

        {/* Architectural Details */}
        <section className="max-w-[1600px] mx-auto px-6 py-16 mb-12">
          <FadeIn delay={0.2}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-level-1">
                <h4 className="text-base font-semibold text-on-background mb-2">
                  Unified Data Layer
                </h4>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Our architecture eliminates silos. Information captured during
                  the lead phase flows seamlessly into project execution and
                  financial reporting.
                </p>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-level-1">
                <h4 className="text-base font-semibold text-on-background mb-2">
                  Automated Governance
                </h4>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Built-in compliance checks and workflow gates ensure that
                  every project follows your company&apos;s standard operating
                  procedures without manual oversight.
                </p>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-level-1">
                <h4 className="text-base font-semibold text-on-background mb-2">
                  AI Orchestration
                </h4>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Advanced algorithms predict potential bottlenecks before they
                  happen, suggesting resource reallocations to keep your
                  projects on schedule.
                </p>
              </div>
            </div>
          </FadeIn>
        </section>
      </main>
      <Footer />
    </div>
  );
}
