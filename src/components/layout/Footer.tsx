import Image from "next/image";
import Link from "next/link";

const platformLinks = [
  { label: "Overview", href: "/" },
  { label: "Modules", href: "/modules" },
  { label: "Workflow", href: "/workflow" },
  { label: "Security & access", href: "/security" },
];
const accountLinks = [
  { label: "Sign in", href: "/login" },
  { label: "Create an account", href: "/register" },
];

export default function Footer() {
  return (
    <footer className="mt-8 border-t border-outline-variant bg-surface-container-low pb-8 pt-12">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-6 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-3"
            aria-label="ConstructPro ERP home"
          >
            <Image
              src="/logos/IsharaHomesLogo.png"
              alt=""
              width={36}
              height={36}
              className="object-contain"
            />
            <span className="text-xl font-bold text-on-background">
              ConstructPro <span className="text-primary">ERP</span>
            </span>
          </Link>
          <p className="max-w-md text-sm leading-relaxed text-on-surface-variant">
            A shared workspace for construction leads, quotations, project
            delivery, invoices, and payments.
          </p>
        </div>
        {[
          { title: "Platform", links: platformLinks },
          { title: "Account", links: accountLinks },
        ].map((group) => (
          <nav
            key={group.title}
            aria-label={group.title + " footer navigation"}
          >
            <h2 className="mb-5 text-xs font-bold uppercase tracking-wider text-on-background">
              {group.title}
            </h2>
            <ul className="space-y-3">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-on-surface-variant hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mx-auto mt-10 max-w-[1200px] px-6">
        <p className="border-t border-outline-variant pt-6 text-xs text-on-surface-variant">
          © {new Date().getFullYear()} ConstructPro ERP · Ishara Homes Pvt. Ltd.
          All rights reserved.
        </p>
      </div>
    </footer>
  );
}
