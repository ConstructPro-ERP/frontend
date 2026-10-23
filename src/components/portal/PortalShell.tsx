"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import { logout } from "@/store/slices/authSlice";
import { clearTokens } from "@/lib/token";
import { dashboardQueryCache } from "@/lib/dashboardQueryCache";
import { canAccessPortal } from "@/lib/portalAccess";
import { isPortalNavActive, portalNavItems } from "./portalConfig";
import { PortalLoading, portalButtonClass, portalPanelClass } from "./PortalUI";

function AccessNotice({ signedIn }: { signedIn: boolean }) {
  return (
    <div className={`${portalPanelClass} mx-auto mt-10 max-w-lg p-6`}>
      <p role="status" className="text-on-background">
        {signedIn
          ? "The client portal is only available to client accounts."
          : "Sign in with your client account to view your projects."}
      </p>
      <Link
        href={signedIn ? "/modules" : "/login"}
        className="mt-4 inline-block font-semibold text-primary"
      >
        {signedIn ? "Back to modules" : "Sign in"}
      </Link>
    </div>
  );
}

export default function PortalShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const allowed = canAccessPortal(user?.role);

  const handleSignOut = () => {
    clearTokens();
    dashboardQueryCache.clear();
    dispatch(logout());
    router.push("/");
  };

  const name = user ? `${user.firstName} ${user.lastName}`.trim() : "";

  return (
    <div className="flex min-h-screen flex-col bg-surface-bg">
      <a
        href="#portal-main-content"
        className="sr-only z-60 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-on-primary focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>
      <header className="border-b border-outline-variant bg-surface-container-lowest">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/portal" className="flex items-center gap-2.5">
            <Image
              src="/logos/IsharaHomesLogo.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg object-contain"
              priority
            />
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-tight text-on-background">
                ConstructPro
              </span>
              <span className="text-[10px] tracking-[0.04em] text-on-surface-muted">
                Client portal
              </span>
            </span>
          </Link>
          {allowed ? (
            <div className="flex items-center gap-3">
              <span className="hidden max-w-48 truncate text-sm text-on-surface-variant sm:inline">
                {name || user?.email}
              </span>
              <button
                type="button"
                className={portalButtonClass}
                onClick={handleSignOut}
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          ) : null}
        </div>
        {allowed ? (
          <nav
            aria-label="Client portal"
            className="mx-auto w-full max-w-6xl overflow-x-auto px-2"
          >
            <ul className="flex min-w-max gap-1">
              {portalNavItems.map((item) => {
                const Icon = item.icon;
                const active = isPortalNavActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${
                        active
                          ? "border-primary font-semibold text-primary"
                          : "border-transparent text-on-surface-variant hover:text-on-background"
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
        ) : null}
      </header>

      <main
        id="portal-main-content"
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-6"
      >
        {isLoading ? (
          <PortalLoading label="Loading your portal" />
        ) : allowed ? (
          // Remount per account so no state carries over between sign-ins.
          <div key={user?.id}>{children}</div>
        ) : (
          <AccessNotice signedIn={!!user} />
        )}
      </main>
    </div>
  );
}
