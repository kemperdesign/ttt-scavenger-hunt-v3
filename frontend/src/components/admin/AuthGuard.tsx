"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/api";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const [checked, setChecked] = useState(isLoginPage);

  useEffect(() => {
    // The login page must render without an auth check — it's wrapped by the
    // same admin layout as every other /admin/* route, so guarding it too
    // caused an infinite redirect loop: fail auth -> replace to /admin/login
    // -> AuthGuard mounts again -> fail auth -> replace... forever.
    if (isLoginPage) return;

    (async () => {
      try {
        const user = await getCurrentUser();
        if (!user.is_admin) {
          router.replace("/admin/login");
          return;
        }
        setChecked(true);
      } catch {
        router.replace("/admin/login");
      }
    })();
  }, [router, isLoginPage]);

  if (!checked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center" role="status">
        <p className="text-slate-400">Verifying access…</p>
      </div>
    );
  }

  return <>{children}</>;
}
