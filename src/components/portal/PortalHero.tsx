"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import {
  getPortalPageConfig,
  isPortalNavActive,
  portalNavItems,
} from "./portalConfig";

/** Page heading with the portal's section navigation. */
export default function PortalHero() {
  const pathname = usePathname();
  const firstName = useSelector(
    (state: RootState) => state.auth.user?.firstName,
  );
  const config = getPortalPageConfig(pathname);
  const isOverview = pathname === "/portal";

  return (
    <section className="border-b border-outline-variant bg-surface-container-lowest">
      <div className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Client portal
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-on-background sm:text-3xl">
          {isOverview && firstName
            ? `Welcome back, ${firstName}`
            : config.title}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-on-surface-variant sm:text-base">
          {config.description}
        </p>

        <nav
          aria-label="Client portal"
          className="-mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0"
        >
          <ul className="flex min-w-max gap-6">
            {portalNavItems.map((item) => {
              const Icon = item.icon;
              const active = isPortalNavActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary ${
                      active
                        ? "border-primary font-semibold text-primary"
                        : "border-transparent text-on-surface-variant hover:border-outline hover:text-on-background"
                    }`}
                  >
                    <Icon size={16} aria-hidden="true" />
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </section>
  );
}
