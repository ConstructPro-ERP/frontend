// src/components/ui/AuthLayout.tsx
import Image from "next/image";

interface AuthLayoutProps {
  children: React.ReactNode;
  illustration?: React.ReactNode;
}

export default function AuthLayout({
  children,
  illustration,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-action">
      {/* Left: Form Panel */}
      <div className="relative w-full lg:w-[55%] flex flex-col justify-center px-8 py-12 lg:px-20 bg-surface-container-lowest lg:rounded-r-[40px] z-10 shadow-2xl">
        {/* Company Logo */}
        <div className="absolute top-8 left-8 lg:left-20 flex items-center gap-3">
          <Image
            src="/logos/IsharaHomesLogo.png"
            alt="ConstructPro ERP Logo"
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
          />
          <span className="text-lg font-bold text-on-background tracking-tight">
            ConstructPro ERP
          </span>
        </div>

        {/* Form content */}
        <div className="w-full max-w-md mx-auto mt-12">{children}</div>
      </div>

      {/* Right: Illustration Panel */}
      <div className="hidden lg:flex lg:w-[45%] relative items-center justify-center">
        {illustration}
      </div>
    </div>
  );
}
