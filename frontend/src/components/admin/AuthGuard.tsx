"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/api";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
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
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center" role="status">
        <p className="text-slate-400">Verifying access…</p>
      </div>
    );
  }

  return <>{children}</>;
}
