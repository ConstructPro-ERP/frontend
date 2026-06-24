// src/components/layout/Header.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/store";
import { logout } from "@/store/slices/authSlice";
import { clearTokens } from "@/lib/token";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Overview", href: "/" },
  { label: "Modules", href: "/modules" },
  { label: "Workflow", href: "/workflow" },
  { label: "Security", href: "/security" },
];

/**
 * Header — fixed top navigation bar using the "Glass-on-Steel" aesthetic.
 * Height: 72px. Backdrop blur with a bottom border to separate from content.
 */
export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const handleSignOut = () => {
    dispatch(logout());
    clearTokens();
    router.push("/");
  };

  return (
    <header className="glass-nav backdrop-blur-md fixed top-0 w-full z-50 border-b border-outline-variant h-[72px] flex items-center">
      <div className="flex justify-between items-center w-full max-w-[1600px] mx-auto px-6">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-3 shrink-0"
          aria-label="ConstructPro ERP Home"
        >
          <Image
            src="/logos/IsharaHomesLogo.png"
            alt="Ishara Homes Logo"
            width={36}
            height={36}
            className="rounded object-contain"
            priority
          />
          <span className="text-xl font-bold text-on-background tracking-tight leading-none">
            ConstructPro <span className="text-primary">ERP</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav
          className="hidden md:flex items-center gap-8"
          aria-label="Primary navigation"
        >
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group relative text-sm font-semibold transition-colors duration-200 ${
                  isActive
                    ? "text-primary"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {link.label}
                <span
                  className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300 ${
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                href="/"
                className="text-sm font-semibold text-primary px-4 py-2 rounded-lg hover:bg-surface-container transition-colors duration-200"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-sm font-semibold bg-primary text-on-primary px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors duration-200"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-primary px-4 py-2 rounded-lg hover:bg-surface-container transition-colors duration-200"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold bg-primary text-on-primary px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors duration-200"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          className="md:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileOpen && (
        <div className="absolute top-[72px] left-0 w-full bg-surface-container-lowest border-b border-outline-variant shadow-level-1 md:hidden">
          <nav
            className="flex flex-col px-6 py-4 gap-4"
            aria-label="Mobile navigation"
          >
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group relative text-sm font-semibold transition-colors w-fit ${
                    isActive
                      ? "text-primary"
                      : "text-on-surface-variant hover:text-primary"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300 ${
                      isActive ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              );
            })}
            <hr className="border-outline-variant" />
            <div className="flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/"
                    onClick={() => setMobileOpen(false)}
                    className="text-sm font-semibold text-primary text-left py-1"
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      handleSignOut();
                    }}
                    className="text-sm font-semibold bg-primary text-on-primary px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors text-center"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="text-sm font-semibold text-primary text-left py-1"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="text-sm font-semibold bg-primary text-on-primary px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors text-center"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
