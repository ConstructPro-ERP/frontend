"use client";

import Link from "next/link";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { canAccessPortal } from "@/lib/portalAccess";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import PortalHero from "./PortalHero";
import { PortalLoading, portalPanelClass } from "./PortalUI";

function AccessNotice({ signedIn }: Readonly<{ signedIn: boolean }>) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 items-center px-4 py-16">
      <div className={`${portalPanelClass} w-full p-6`}>
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
    </div>
  );
}

export default function PortalShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const allowed = canAccessPortal(user?.role);

  return (
    <div className="flex min-h-screen flex-col bg-surface-bg">
      <a
        href="#portal-main-content"
        className="sr-only z-60 rounded-lg bg-primary px-4 py-2 text-on-primary focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>
      <Header />
      <main id="portal-main-content" className="flex flex-1 flex-col pt-18">
        {isLoading ? (
          <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
            <PortalLoading label="Loading your portal" />
          </div>
        ) : allowed ? (
          <>
            <PortalHero />
            {/* Remount per account so no state carries over between sign-ins. */}
            <div
              key={user?.id}
              className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8 sm:px-6"
            >
              {children}
            </div>
          </>
        ) : (
          <AccessNotice signedIn={!!user} />
        )}
      </main>
      <Footer />
    </div>
  );
}
