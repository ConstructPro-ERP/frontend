"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Check,
  CreditCard,
  DollarSign,
  Folder,
  House,
  Users,
  FileText,
  RefreshCcw,
} from "lucide-react";
import { ApiError } from "@/lib/ApiError";
import {
  getDashboardSummary,
  getDashboardProjects,
  getDashboardRevenue,
  getDashboardStatusCounts,
  getDashboardActivity,
} from "@/services/dashboardApi";
import type { DashboardActivity } from "@/types/dashboard";
import styles from "./HomeDashboard.module.css";

function useSection<T>(loader: () => Promise<T>) {
  const [state, setState] = useState<{
    data?: T;
    error?: string;
    loading: boolean;
  }>({ loading: true });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    loader()
      .then((data) => {
        if (active) setState({ data, loading: false });
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message =
          error instanceof ApiError && error.statusCode === 403
            ? "Your role does not have access to this information."
            : error instanceof ApiError && error.statusCode === 401
              ? "Please sign in again to view this information."
              : error instanceof Error
                ? error.message
                : "This information could not be loaded.";
        setState({ error: message, loading: false });
      });
    return () => {
      active = false;
    };
  }, [loader, version]);
  return {
    ...state,
    retry: () => {
      setState({ loading: true });
      setVersion((value) => value + 1);
    },
  };
}

const compact = (value: number) =>
  new Intl.NumberFormat("en-LK", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
const money = (value: number) => `LKR ${compact(value)}`;
const fullMoney = (value: number) =>
  new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(
    value,
  );

function State({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error?: string;
  retry: () => void;
}) {
  return (
    <div className={styles.state} role="status">
      {loading ? (
        <>
          <RefreshCcw size={16} className="animate-spin" /> Loading…
        </>
      ) : (
        <>
          <p>{error}</p>
          <button onClick={retry} className={styles.button}>
            Try again
          </button>
        </>
      )}
    </div>
  );
}
function Card({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Kpis() {
  const section = useSection(getDashboardSummary);
  if (!section.data) return <State {...section} />;
  const { revenue, projects, sales, invoices } = section.data;
  const cards = [
    {
      label: "Total Revenue",
      value: money(revenue.totalRevenue),
      note: "Total invoiced value",
      icon: DollarSign,
      tone: "info",
    },
    {
      label: "Active Projects",
      value: projects.activeProjectCount.toLocaleString(),
      note: `${projects.completedProjectCount} projects completed`,
      icon: House,
      tone: "success",
    },
    {
      label: "Total Leads",
      value: sales.totalLeads.toLocaleString(),
      note: `${sales.convertedLeads} converted leads`,
      icon: Users,
      tone: "warning",
    },
    {
      label: "Outstanding Payments",
      value: money(revenue.outstandingBalance),
      note: `${invoices.overdueCount} invoices overdue`,
      icon: CreditCard,
      tone: "danger",
    },
  ];
  return (
    <section className={styles.kpiGrid} aria-label="Business overview">
      {cards.map(({ label, value, note, icon: Icon, tone }) => (
        <article key={label} className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={`${styles.icon} ${styles[tone]}`}>
              <Icon size={20} />
            </span>
          </div>
          <div>
            <p className={styles.kpiValue}>{value}</p>
            <h2 className={styles.kpiLabel}>{label}</h2>
          </div>
          <p className={styles.kpiSub}>{note}</p>
        </article>
      ))}
    </section>
  );
}

function Projects() {
  const section = useSection(getDashboardProjects);
  return (
    <Card
      title="Active Projects"
      subtitle="Milestone progress overview"
      action={
        <Link className={styles.link} href="/dashboard/projects">
          View all →
        </Link>
      }
    >
      {!section.data ? (
        <State {...section} />
      ) : !section.data.length ? (
        <p className={styles.empty}>No active projects yet.</p>
      ) : (
        <div
          className={styles.tableScroll}
          tabIndex={0}
          aria-label="Active projects table"
        >
          <table className={styles.table}>
            <thead>
              <tr>
                {["Project", "Client", "Progress", "Status", "Due"].map(
                  (label) => (
                    <th scope="col" key={label}>
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {section.data.map((project) => {
                const progress = Math.min(
                  100,
                  Math.max(0, project.completionPercentage),
                );
                return (
                  <tr key={project.projectId}>
                    <td>
                      <span className={styles.projectName}>
                        {project.projectName}
                      </span>
                      <span className={styles.muted}>
                        {project.completedMilestoneCount} of{" "}
                        {project.milestoneCount} milestones
                      </span>
                    </td>
                    <td className={styles.muted}>
                      <span title="Client information is not provided by the project report">
                        Unavailable
                      </span>
                    </td>
                    <td>
                      <div className={styles.progressWrap}>
                        <div
                          className={styles.progress}
                          role="progressbar"
                          aria-label={`${project.projectName} milestone completion`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={progress}
                        >
                          <span style={{ width: `${progress}%` }} />
                        </div>
                        <span className={styles.percentage}>
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles.info}`}>
                        <span className={styles.dot} />
                        Active
                      </span>
                    </td>
                    <td className={styles.due}>
                      {project.endDate
                        ? new Date(project.endDate).toLocaleDateString(
                            "en-GB",
                            { month: "short", year: "numeric" },
                          )
                        : "Not set"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function Revenue() {
  const section = useSection(getDashboardRevenue);
  const rows = section.data ?? [];
  const maximum = Math.max(1, ...rows.map((row) => row.revenue));
  const totals = rows.reduce(
    (sum, row) => ({
      revenue: sum.revenue + row.revenue,
      paid: sum.paid + row.paid,
      outstanding: sum.outstanding + row.outstanding,
    }),
    { revenue: 0, paid: 0, outstanding: 0 },
  );
  const period = rows.length
    ? `${rows[0].label} – ${rows[rows.length - 1].label}`
    : "Last six months";
  return (
    <Card title="Revenue" subtitle={`${period} · LKR · current month to date`}>
      {!section.data ? (
        <State {...section} />
      ) : (
        <>
          <div className={styles.chartWrap}>
            <div
              className={styles.bars}
              role="img"
              aria-label={`Monthly invoiced revenue. ${rows.map((row) => `${row.label}: ${fullMoney(row.revenue)}`).join(". ")}`}
            >
              {rows.map((row) => (
                <div
                  key={row.month}
                  className={styles.barGroup}
                  title={`${row.label}: ${fullMoney(row.revenue)}`}
                >
                  <span className={styles.barValue}>
                    {compact(row.revenue)}
                  </span>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.bar}
                      style={{ height: `${(row.revenue / maximum) * 100}%` }}
                    />
                  </div>
                  <span className={styles.barLabel}>
                    {row.label.split(" ")[0]}
                  </span>
                </div>
              ))}
            </div>
            {totals.revenue === 0 && (
              <p className={styles.chartNote}>
                No invoiced revenue in this period.
              </p>
            )}
          </div>
          <div className={styles.stats}>
            {[
              { label: "Period Revenue", value: totals.revenue },
              { label: "Collected", value: totals.paid },
              { label: "Outstanding", value: totals.outstanding },
            ].map((stat) => (
              <div key={stat.label}>
                <p title={fullMoney(stat.value)}>{compact(stat.value)}</p>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

function ProjectStatus() {
  const section = useSection(getDashboardStatusCounts);
  const total = section.data?.reduce((sum, item) => sum + item.count, 0) ?? 0;
  const segments =
    section.data?.map((item, index, items) => ({
      ...item,
      start:
        (items
          .slice(0, index)
          .reduce((sum, previous) => sum + previous.count, 0) /
          (total || 1)) *
        100,
      percentage: (item.count / (total || 1)) * 100,
    })) ?? [];
  return (
    <Card title="Project Status" subtitle="All projects">
      <div className={styles.donutWrap}>
        {!section.data ? (
          <State {...section} />
        ) : (
          <>
            <svg
              width="110"
              height="110"
              viewBox="0 0 42 42"
              role="img"
              aria-label={`${total} projects. ${segments.map((item) => `${item.label}: ${item.count}`).join(". ")}`}
            >
              <circle
                cx="21"
                cy="21"
                r="15.9155"
                fill="none"
                stroke="var(--dash-border)"
                strokeWidth="4"
              />
              {segments
                .filter((item) => item.count > 0)
                .map((item) => (
                  <circle
                    key={item.status}
                    cx="21"
                    cy="21"
                    r="15.9155"
                    fill="none"
                    stroke={item.color}
                    strokeWidth="4"
                    strokeDasharray={`${item.percentage} ${100 - item.percentage}`}
                    strokeDashoffset={25 - item.start}
                  />
                ))}
              <text
                x="21"
                y="24"
                textAnchor="middle"
                fontSize="6"
                fontWeight="700"
                fill="var(--dash-text)"
              >
                {total}
              </text>
              <text
                x="21"
                y="17"
                textAnchor="middle"
                fontSize="3.5"
                fill="var(--dash-muted)"
              >
                projects
              </text>
            </svg>
            <ul className={styles.legend}>
              {segments.map((item) => (
                <li key={item.status}>
                  <span>
                    <i style={{ background: item.color }} />
                    {item.label}
                  </span>
                  <strong>{item.count}</strong>
                </li>
              ))}
            </ul>
            {total === 0 && (
              <p className={styles.chartNote}>No projects yet.</p>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

const activityIcons: Record<string, typeof Check> = {
  quotation: Check,
  payment: CreditCard,
  invoice: CreditCard,
  lead: Users,
  document: Folder,
  project: House,
  milestone: FileText,
};
function ActivityRow({ item }: { item: DashboardActivity }) {
  const Icon = activityIcons[item.type] ?? FileText;
  const tone =
    item.type === "quotation"
      ? "success"
      : item.type === "lead"
        ? "warning"
        : "info";
  return (
    <li className={styles.activity}>
      <span className={`${styles.activityIcon} ${styles[tone]}`}>
        <Icon size={14} />
      </span>
      <div>
        <p>
          <strong>{item.title}</strong>
          {item.description && <> — {item.description}</>}
        </p>
        <time dateTime={item.occurredAt}>
          {new Date(item.occurredAt).toLocaleString("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </time>
      </div>
    </li>
  );
}
function Activity() {
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const loader = useCallback(() => getDashboardActivity(page), [page]);
  const section = useSection(loader);
  const visible = section.data?.page === page ? section.data : undefined;
  const navigate = (next: number) => {
    setPage(next);
  };
  return (
    <Card
      title="Recent Activity"
      subtitle="Latest events across all modules"
      action={
        <button
          className={styles.button}
          aria-expanded={expanded}
          aria-controls="dashboard-activity"
          onClick={() => {
            setExpanded((value) => !value);
            setPage(1);
          }}
        >
          {expanded ? "Close log" : "View log"}
        </button>
      }
    >
      <div id="dashboard-activity">
        {section.error ? (
          <State {...section} />
        ) : !visible ? (
          <State loading retry={section.retry} />
        ) : (
          <>
            <ul className={styles.activities}>
              {visible.items.map((item, index) => (
                <ActivityRow
                  key={`${item.type}-${item.entityId}-${item.occurredAt}-${index}`}
                  item={item}
                />
              ))}
            </ul>
            {!visible.items.length && (
              <p className={styles.empty}>No recent activity yet.</p>
            )}
            {expanded && (
              <nav
                className={styles.pagination}
                aria-label="Activity log pages"
              >
                <button
                  className={styles.button}
                  disabled={page <= 1}
                  onClick={() => navigate(page - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {page} of {Math.max(1, visible.totalPages)}
                </span>
                <button
                  className={styles.button}
                  disabled={page >= visible.totalPages}
                  onClick={() => navigate(page + 1)}
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

export default function DashboardKpiClient() {
  return (
    <div className={styles.dashboard} aria-live="polite">
      <Kpis />
      <div className={styles.contentGrid}>
        <Projects />
        <div className={styles.rightColumn}>
          <Revenue />
          <ProjectStatus />
        </div>
      </div>
      <Activity />
    </div>
  );
}
