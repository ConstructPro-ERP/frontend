import type { Metadata } from "next";
import {
  Activity,
  AlertTriangle,
  CircleDollarSign,
  FolderKanban,
  TrendingUp,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard | ConstructPro ERP",
  description: "Operations dashboard overview for ConstructPro.",
};

const metricCards = [
  {
    label: "Monthly Revenue",
    value: "LKR 48.2M",
    note: "+12.4% vs last month",
    icon: CircleDollarSign,
  },
  {
    label: "Active Projects",
    value: "14",
    note: "3 nearing handover",
    icon: FolderKanban,
  },
  {
    label: "Open Workflow Alerts",
    value: "06",
    note: "2 require follow-up today",
    icon: AlertTriangle,
  },
  {
    label: "Operational Velocity",
    value: "84%",
    note: "Healthy milestone completion",
    icon: TrendingUp,
  },
];

export default function DashboardHomePage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className="rounded-[24px] border border-outline-variant bg-surface-container-lowest p-5 shadow-level-1"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-on-surface-variant">
                    {card.label}
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-on-background">
                    {card.value}
                  </p>
                </div>
                <div className="rounded-2xl bg-primary-soft p-3 text-primary">
                  <Icon size={20} />
                </div>
              </div>
              <p className="mt-5 text-sm text-on-surface-muted">{card.note}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <article className="rounded-[28px] border border-outline-variant bg-surface-container-lowest shadow-level-1">
          <div className="flex items-center justify-between border-b border-outline-variant px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold text-on-background">
                ERP Overview
              </h2>
              <p className="text-sm text-on-surface-variant">
                Adapted from the approved dashboard prototype shell.
              </p>
            </div>
            <Activity className="text-primary" size={20} />
          </div>
          <div className="grid gap-4 p-6 md:grid-cols-2">
            {[
              "Shared sidebar and header now wrap all dashboard routes.",
              "Active route highlighting follows the current App Router path.",
              "Mobile navigation uses an overlay drawer for small screens.",
              "Finance and Analytics now inherit this same dashboard layout.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-outline-variant bg-surface-container p-4 text-sm leading-6 text-on-surface-variant"
              >
                {item}
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-6 shadow-level-1">
          <h2 className="text-lg font-semibold text-on-background">
            Ready Modules
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Placeholder routes are available for the core navigation set.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Dashboard",
              "Users",
              "Leads",
              "Quotations",
              "Projects",
              "Documents",
              "Finance",
              "Analytics",
            ].map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-outline-variant bg-surface-container px-4 py-3 text-sm font-medium text-on-background"
              >
                {item}
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
