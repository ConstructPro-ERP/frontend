"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import AuthButton from "@/components/ui/AuthButton";
import { googleLoginUrl } from "@/services/googleAuth";

export default function GoogleLoginButton({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const reset = () => setRedirecting(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  return (
    <AuthButton
      type="button"
      variant="google"
      disabled={disabled}
      isLoading={redirecting}
      onClick={() => {
        setRedirecting(true);
        window.location.assign(googleLoginUrl);
      }}
    >
      <Image
        src="/logos/google-icon.svg"
        alt=""
        width={20}
        height={20}
        aria-hidden="true"
      />
      Sign in with Google
    </AuthButton>
  );
}
