import PublicPage, {
  PublicCards,
  PublicCta,
  PublicHero,
  PublicSection,
} from "@/components/marketing/PublicPage";
import { publicWorkflow } from "@/lib/publicContent";
import { FileCheck, HardHat, Wallet } from "lucide-react";

export const metadata = {
  title: "Workflow - ConstructPro ERP",
  description:
    "Follow supported ConstructPro workflows from lead management and quotations to projects, invoices, and recorded payments.",
};

const details = [
  {
    icon: FileCheck,
    title: "Quotations become projects",
    description:
      "Manage quotation approval and revision before converting approved work into a project. Keep the quotation and project linked.",
  },
  {
    icon: HardHat,
    title: "Project work stays together",
    description:
      "Manage milestones, tasks, resources, expenses, documents, and Google Calendar events from project details.",
  },
  {
    icon: Wallet,
    title: "Payments are recorded against invoices",
    description:
      "Record payments your business has received and review each invoice's paid and outstanding amounts.",
  },
];

export default function WorkflowPage() {
  return (
    <PublicPage>
      <PublicHero
        eyebrow="Business workflow"
        title="Keep each stage of the job connected"
        description="Start with a lead, prepare a quotation, manage the project, and follow its invoices and payments. Your team updates each stage using the tools available to its roles."
      />
      <PublicSection
        title="From inquiry to payment"
        description="A practical workflow built around the records and actions available in ConstructPro."
      >
        <ol className="grid gap-5 md:grid-cols-2">
          {publicWorkflow.map((step, i) => (
            <li
              key={step.title}
              className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-level-1"
            >
              <span className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                {i + 1}
              </span>
              <h3 className="mb-3 text-lg font-semibold text-on-background">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </PublicSection>
      <PublicSection title="The details behind each stage">
        <PublicCards items={details} />
      </PublicSection>
      <PublicCta />
    </PublicPage>
  );
}
