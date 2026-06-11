// src/app/security/page.tsx
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FadeIn from "@/components/animations/FadeIn";
import {
  Key,
  Lock,
  Shield,
  CloudCog,
  ShieldCheck,
  HardHat,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Eye,
  Download,
} from "lucide-react";

export const metadata = {
  title: "Security & Compliance - ConstructPro ERP",
  description: "Enterprise Security Framework and Governance.",
};

const technicalLayers = [
  {
    icon: Key,
    title: "Identity Management",
    description:
      "Stateless session management via RS256-signed JWTs. Features secure HttpOnly refresh rotation and multi-factor authentication (MFA) enforcement.",
    tags: ["OAuth 2.0", "OpenID Connect"],
  },
  {
    icon: Lock,
    title: "Advanced Encryption",
    description:
      "End-to-end protection with AES-256-GCM for data at rest across all database clusters and mandatory TLS 1.3 for all traffic in transit.",
    tags: ["AES-256", "FIPS 140-2"],
  },
  {
    icon: Shield,
    title: "Network Perimeter",
    description:
      "Intelligent WAF protection against OWASP Top 10, combined with cloud-native DDoS mitigation and granular API rate limiting.",
    tags: ["WAF", "Intrusion Detection"],
  },
];

const rbacRoles = [
  {
    icon: ShieldCheck,
    title: "System Administrator",
    badge: "Global Access",
    description:
      "Complete administrative oversight including cross-departmental user provisioning, security policy configuration, and financial auditing.",
    permissions: [
      {
        label: "Financials",
        status: "Full Read/Write",
        icon: CheckCircle2,
        colorClass: "text-risk-low",
      },
      {
        label: "Workflows",
        status: "Management",
        icon: CheckCircle2,
        colorClass: "text-risk-low",
      },
      {
        label: "Configuration",
        status: "Global Access",
        icon: CheckCircle2,
        colorClass: "text-risk-low",
      },
      {
        label: "Audit Logs",
        status: "Immutable View",
        icon: CheckCircle2,
        colorClass: "text-risk-low",
      },
    ],
  },
  {
    icon: HardHat,
    title: "Project Director",
    badge: "Scoped Access",
    description:
      "Operational control within assigned project scopes. Access is restricted to site-specific documentation, labor schedules, and procurement.",
    permissions: [
      {
        label: "Financials",
        status: "Scoped Only",
        icon: AlertTriangle,
        colorClass: "text-risk-medium",
      },
      {
        label: "Workflows",
        status: "Site Mgmt",
        icon: CheckCircle2,
        colorClass: "text-risk-low",
      },
      {
        label: "Configuration",
        status: "No Access",
        icon: Ban,
        colorClass: "text-outline",
      },
      {
        label: "Field Logs",
        status: "Full Edit",
        icon: CheckCircle2,
        colorClass: "text-risk-low",
      },
    ],
  },
  {
    icon: FileCheck,
    title: "Compliance Auditor",
    badge: "Read-Only",
    description:
      "Third-party or internal oversight access. Strictly read-only visibility into documentation, certificates, and safety audit trails.",
    permissions: [
      {
        label: "Financials",
        status: "No Access",
        icon: Ban,
        colorClass: "text-outline",
      },
      {
        label: "Workflows",
        status: "Read Only",
        icon: Eye,
        colorClass: "text-primary",
      },
      {
        label: "Configuration",
        status: "No Access",
        icon: Ban,
        colorClass: "text-outline",
      },
      {
        label: "Reports",
        status: "Full Export",
        icon: Download,
        colorClass: "text-primary",
      },
    ],
  },
];

export default function SecurityPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pt-[72px]">
        {/* Hero */}
        <section className="max-w-[1600px] mx-auto px-6 py-20 flex flex-col items-center text-center">
          <FadeIn>
            <span className="inline-block bg-surface-container-high text-on-surface text-xs font-semibold px-3 py-1 rounded-full border border-outline-variant mb-6 tracking-wide uppercase">
              Enterprise Security Framework
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-on-background leading-tight tracking-tight max-w-4xl mx-auto mb-6">
              Infrastructure & Access{" "}
              <span className="text-primary">Governance</span>
            </h1>
            <p className="text-lg text-on-surface-variant max-w-3xl mx-auto mb-12 leading-relaxed">
              ConstructPro operates on a zero-trust foundation, utilizing
              advanced cryptographic protocols and precise role-based controls
              to protect critical construction data across the enterprise.
            </p>
          </FadeIn>
        </section>

        {/* Technical Layers */}
        <section className="max-w-[1600px] mx-auto px-6 py-16">
          <FadeIn>
            <h2 className="text-2xl md:text-3xl font-bold text-center text-on-background mb-12">
              Technical Security Layers
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {technicalLayers.map((layer, i) => {
              const Icon = layer.icon;
              return (
                <FadeIn key={layer.title} delay={i * 0.08}>
                  <div className="bg-surface-container-lowest rounded-xl p-6 shadow-level-1 border border-outline-variant h-full flex flex-col">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center mb-4">
                      <Icon size={20} className="text-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-on-background mb-2">
                      {layer.title}
                    </h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed mb-6 flex-1">
                      {layer.description}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-outline-variant">
                      {layer.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </section>

        {/* Visual Abstract */}
        <section className="max-w-[1600px] mx-auto px-6 py-16">
          <FadeIn>
            <div className="bg-primary rounded-2xl p-12 text-center overflow-hidden relative shadow-level-2">
              <div className="absolute inset-0 bg-white/5" />
              <div className="relative z-10 flex flex-col items-center">
                <CloudCog size={48} className="text-white mb-6" />
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Immutable Infrastructure Logging
                </h2>
                <p className="text-sm text-blue-100 max-w-2xl mx-auto leading-relaxed">
                  Comprehensive audit trails capture every system interaction.
                  Log integrity is guaranteed via cryptographic hashing,
                  ensuring forensic reliability for compliance audits.
                </p>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* Governance & Access Control */}
        <section className="max-w-[1600px] mx-auto px-6 py-16 mb-12">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-on-background mb-4">
                Governance & Access Control
              </h2>
              <p className="text-sm text-on-surface-variant max-w-2xl mx-auto">
                Secure, customised environments tailored to the specific
                responsibilities of each team member.
              </p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {rbacRoles.map((role, i) => {
              const RoleIcon = role.icon;
              return (
                <FadeIn key={role.title} delay={i * 0.07} className="h-full">
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-level-1 flex flex-col h-full">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                        <RoleIcon
                          size={20}
                          className="text-on-surface-variant"
                        />
                      </div>
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

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-outline-variant mt-auto">
                      {role.permissions.map((perm) => {
                        const PermIcon = perm.icon;
                        return (
                          <div
                            key={perm.label}
                            className="bg-surface-container/50 p-3 rounded-lg border border-outline-variant/50"
                          >
                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                              {perm.label}
                            </p>
                            <span
                              className={`${perm.colorClass} font-semibold text-xs flex items-center gap-1.5`}
                            >
                              <PermIcon size={14} /> {perm.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
