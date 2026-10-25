import PublicPage, {
  PublicCards,
  PublicCta,
  PublicHero,
  PublicSection,
} from "@/components/marketing/PublicPage";
import { publicSecurity } from "@/lib/publicContent";
import { roleLabel, standardRoleNames } from "@/lib/userManagement";

export const metadata = {
  title: "Security & Access - ConstructPro ERP",
  description:
    "Learn about ConstructPro account authentication, role-based authorization, project access, and administrator account controls.",
};

export default function SecurityPage() {
  return (
    <PublicPage>
      <PublicHero
        eyebrow="Security & access"
        title="Control who can access your work"
        description="ConstructPro uses authenticated accounts, permission checks, and project access rules to protect business operations."
      />
      <PublicSection
        title="Implemented access controls"
        description="These controls are part of the application's account and API workflows."
      >
        <PublicCards items={publicSecurity} />
      </PublicSection>
      <PublicSection
        title="Roles with defined access"
        description="The standard role catalog includes the roles below. Available pages and actions depend on permissions and applicable project access rules."
      >
        <ul className="flex flex-wrap justify-center gap-3">
          {standardRoleNames.map((role) => (
            <li
              key={role}
              className="rounded-lg border border-outline-variant bg-surface-container-lowest px-5 py-3 text-sm font-semibold text-on-background"
            >
              {roleLabel(role)}
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-on-surface-variant">
          User management is restricted to administrators. Project managers work
          within their assigned projects. A role name alone does not grant
          access to every module or operation.
        </p>
      </PublicSection>
      <PublicCta />
    </PublicPage>
  );
}
