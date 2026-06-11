// src/components/layout/Footer.tsx
import Image from "next/image";
import Link from "next/link";
import { Globe, Users, Mail, ShieldCheck, BadgeCheck } from "lucide-react";

const platformLinks = [
  { label: "Overview", href: "/" },
  { label: "Modules", href: "/modules" },
  { label: "Workflow", href: "/workflow" },
  { label: "Security", href: "/security" },
];

const solutionLinks = [
  { label: "Residential", href: "#" },
  { label: "Commercial", href: "#" },
  { label: "Infrastructure", href: "#" },
];

const resourceLinks = [
  { label: "Documentation", href: "#" },
  { label: "API Reference", href: "#" },
  { label: "Support Center", href: "#" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Security", href: "#" },
];

/**
 * Footer — multi-column site footer with brand info and navigation links.
 */
export default function Footer() {
  return (
    <footer className="w-full pt-16 pb-8 bg-surface-container-low border-t border-outline-variant">
      <div className="max-w-[1600px] mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12">
        {/* Brand Column */}
        <div className="md:col-span-4">
          <Link
            href="/"
            className="flex items-center gap-3 mb-6"
            aria-label="ConstructPro ERP Home"
          >
            <Image
              src="/logos/IsharaHomesLogo.png"
              alt="Ishara Homes Logo"
              width={36}
              height={36}
              className="rounded object-contain"
            />
            <span className="text-xl font-bold text-on-background tracking-tight leading-none">
              ConstructPro <span className="text-primary">ERP</span>
            </span>
          </Link>
          <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
            The leading construction operations platform unifying project
            management, finance, and AI analytics for modern builders.
          </p>
          <div className="flex gap-4 text-on-surface-variant">
            <Globe
              size={20}
              className="cursor-pointer hover:text-primary transition-colors"
              aria-label="Website"
            />
            <Users
              size={20}
              className="cursor-pointer hover:text-primary transition-colors"
              aria-label="Community"
            />
            <Mail
              size={20}
              className="cursor-pointer hover:text-primary transition-colors"
              aria-label="Contact"
            />
          </div>
        </div>

        {/* Platform Links */}
        <div className="md:col-span-2">
          <h6 className="text-xs font-bold text-on-background mb-6 uppercase tracking-wider">
            Platform
          </h6>
          <ul className="space-y-4">
            {platformLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-sm text-on-surface-variant hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Solutions Links */}
        <div className="md:col-span-2">
          <h6 className="text-xs font-bold text-on-background mb-6 uppercase tracking-wider">
            Solutions
          </h6>
          <ul className="space-y-4">
            {solutionLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-sm text-on-surface-variant hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Resources Links */}
        <div className="md:col-span-2">
          <h6 className="text-xs font-bold text-on-background mb-6 uppercase tracking-wider">
            Resources
          </h6>
          <ul className="space-y-4">
            {resourceLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-sm text-on-surface-variant hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal Links */}
        <div className="md:col-span-2">
          <h6 className="text-xs font-bold text-on-background mb-6 uppercase tracking-wider">
            Legal
          </h6>
          <ul className="space-y-4">
            {legalLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-sm text-on-surface-variant hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-[1600px] mx-auto px-6 mt-16 pt-8 border-t border-outline-variant flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-on-surface-variant">
          © {new Date().getFullYear()} ConstructPro ERP · Ishara Homes Pvt. Ltd.
          All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <ShieldCheck size={14} className="text-risk-low" />
            ISO 27001 Certified
          </span>
          <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <BadgeCheck size={14} className="text-risk-low" />
            SOC2 Compliant
          </span>
        </div>
      </div>
    </footer>
  );
}
