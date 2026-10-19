import PublicPage, {
  PublicCards,
  PublicCta,
  PublicHero,
  PublicSection,
} from "@/components/marketing/PublicPage";
import { publicModules } from "@/lib/publicContent";

export const metadata = {
  title: "Modules - ConstructPro ERP",
  description:
    "Explore ConstructPro's lead, quotation, project, finance, analytics, and account management tools.",
};

export default function ModulesPage() {
  return (
    <PublicPage>
      <PublicHero
        eyebrow="System modules"
        title="One workspace for sales, projects, and finance"
        description="Work with leads and quotations, manage project delivery, and track invoices and payments. The available tools depend on your account's role and permissions."
      />
      <PublicSection
        title="What you can do in ConstructPro"
        description="These tools are available in the current application. Documents and calendar events are managed from project details."
      >
        <PublicCards items={publicModules} detailed />
      </PublicSection>
      <PublicCta />
    </PublicPage>
  );
}
