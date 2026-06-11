// src/app/modules/page.tsx
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FadeIn from "@/components/animations/FadeIn";
import {
  Users,
  FileText,
  HardHat,
  Wallet,
  Folder,
  BarChart2,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "Modules - ConstructPro ERP",
  description: "Explore the modular core of ConstructPro ERP.",
};

const modules = [
  {
    icon: Users,
    title: "Lead Management",
    description:
      "Track prospect lifecycles from initial contact to conversion. Manage engagements and forecast pipeline value with data-driven precision.",
    stats: [
      { label: "Active Leads", value: "142", valueClass: "text-primary" },
      { label: "Conv. Rate", value: "24.5%", valueClass: "text-risk-low" },
    ],
  },
  {
    icon: FileText,
    title: "Quotation Management",
    description:
      "Generate, version, and approve complex multi-phase construction bids with integrated cost modeling and automated approval flows.",
    stats: [
      {
        label: "Pending Approval",
        value: "18",
        valueClass: "text-risk-medium",
      },
      {
        label: "Avg. Turnaround",
        value: "3.2 Days",
        valueClass: "text-on-background",
      },
    ],
  },
  {
    icon: HardHat,
    title: "Project Management",
    description:
      "Execute complex execution plans, track critical milestones, and monitor real-time site progress through a unified interface.",
    stats: [
      { label: "Active Projects", value: "34", valueClass: "text-primary" },
      {
        label: "At Risk",
        value: "2",
        valueClass:
          "text-risk-high px-2 py-0.5 bg-error-container/10 border border-error-container/20 rounded-full",
      },
    ],
  },
  {
    icon: Wallet,
    title: "Finance & Payments",
    description:
      "Streamline accounts receivable, subcontractor payouts, and ledger reconciliation with comprehensive financial health reporting.",
    stats: [
      {
        label: "A/R Aging > 30d",
        value: "$1.2M",
        valueClass: "text-on-background",
      },
      {
        label: "Cash Flow",
        value: (
          <span className="flex items-center gap-1 text-risk-low">
            <TrendingUp size={14} /> Positive
          </span>
        ),
        valueClass: "",
      },
    ],
  },
  {
    icon: Folder,
    title: "Document Management",
    description:
      "Centralized repository for blueprints, permits, and compliance certificates. Secure version control and collaborative access.",
    stats: [
      {
        label: "Indexed Files",
        value: "12.4k",
        valueClass: "text-on-background",
      },
      {
        label: "Storage",
        value: "45% Used",
        valueClass: "text-on-surface-variant font-bold",
      },
    ],
  },
];

export default function ModulesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pt-[72px]">
        {/* Hero */}
        <section className="max-w-[1600px] mx-auto px-6 py-20 flex flex-col items-center text-center">
          <FadeIn>
            <span className="inline-block bg-surface-container-high text-on-surface text-xs font-semibold px-3 py-1 rounded-full border border-outline-variant mb-6 tracking-wide uppercase">
              System Modules
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-on-background leading-tight tracking-tight max-w-4xl mx-auto mb-6">
              Comprehensive Operational{" "}
              <span className="text-primary">Toolkit</span>
            </h1>
            <p className="text-lg text-on-surface-variant max-w-3xl mx-auto mb-12 leading-relaxed">
              Explore the modular core of ConstructPro ERP tailored for modern
              builders. Cross-module reporting, predictive risk modeling, and
              configurable dashboards for operational oversight.
            </p>
          </FadeIn>
        </section>

        {/* Modules Grid */}
        <section className="max-w-[1600px] mx-auto px-6 py-16 bg-surface-container-low rounded-2xl mb-20">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-on-background mb-4">
                Core Integrations
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
                <FadeIn key={mod.title} delay={i * 0.07} className="h-full">
                  <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-level-1 h-full flex flex-col group hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <Icon size={20} className="text-primary" />
                      </div>
                      <h4 className="text-base font-semibold text-on-background">
                        {mod.title}
                      </h4>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed flex-1 mb-6">
                      {mod.description}
                    </p>
                    <div className="pt-4 border-t border-outline-variant flex justify-between items-center">
                      <div>
                        <div className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                          {mod.stats[0].label}
                        </div>
                        <div
                          className={`text-sm font-bold ${mod.stats[0].valueClass}`}
                        >
                          {mod.stats[0].value}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                          {mod.stats[1].label}
                        </div>
                        <div
                          className={`text-sm font-bold ${mod.stats[1].valueClass}`}
                        >
                          {mod.stats[1].value}
                        </div>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              );
            })}

            {/* Intelligence & Analytics Card - Special Style */}
            <FadeIn delay={modules.length * 0.07} className="h-full">
              <div className="bg-primary p-6 rounded-xl border border-primary-container shadow-level-1 h-full flex flex-col group relative overflow-hidden">
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <BarChart2 size={20} className="text-white" />
                  </div>
                  <h4 className="text-base font-semibold text-white">
                    Intelligence & Analytics
                  </h4>
                </div>
                <p className="text-sm text-blue-100 leading-relaxed flex-1 mb-6 relative z-10">
                  Cross-module reporting, predictive risk modeling, and
                  configurable executive dashboards for operational oversight.
                </p>
                <div className="pt-4 border-t border-white/20 flex justify-between items-center relative z-10">
                  <div>
                    <div className="text-[10px] font-semibold text-blue-200 uppercase tracking-wider mb-1">
                      Reports
                    </div>
                    <div className="text-sm font-bold text-white">08</div>
                  </div>
                  <div className="text-right">
                    <button className="text-white text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      View Dashboards <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
