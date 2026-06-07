"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Loader2,
  LogOut,
  Utensils,
  Users,
} from "lucide-react";
import { useState } from "react";

type Role = "admin" | "staff";

type TopNavProps = {
  title: string;
  role: Role;
};

export function TopNav({
  title,
  role,
}: TopNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [loggingOut, setLoggingOut] = useState(false);
  const [switchingPage, setSwitchingPage] = useState(false);

  const isAdminPage = pathname.startsWith("/admin");
  const isStaffPage = pathname.startsWith("/staff");

  const switchHref = isAdminPage
    ? "/staff"
    : "/admin";

  const switchLabel = isAdminPage
    ? "Staff"
    : "Admin";

  const SwitchIcon = isAdminPage
    ? Users
    : LayoutDashboard;

  async function switchPage() {
    if (switchingPage || loggingOut) {
      return;
    }

    setSwitchingPage(true);

    try {
      router.push(switchHref);
      router.refresh();
    } finally {
      /*
       * Keep a small delay so the button does not remain visually
       * disabled if navigation is very fast.
       */
      window.setTimeout(() => {
        setSwitchingPage(false);
      }, 500);
    }
  }

  async function logout() {
    if (loggingOut || switchingPage) {
      return;
    }

    try {
      setLoggingOut(true);

      await fetch("/api/auth/logout", {
        method: "POST",
      });

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);

      router.replace("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  function goHome() {
    if (role === "admin") {
      router.push("/admin");
    } else {
      router.push("/staff");
    }
  }

  return (
    <header className="sticky top-0 z-[100] border-b border-[#064e2b]/10 bg-[#f8fbf6]/95 backdrop-blur-xl">
      <div className="relative z-[101] mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={goHome}
          className="group flex min-w-0 items-center gap-3 text-left"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#064e2b,#087443)] text-white shadow-lg shadow-emerald-950/15 transition group-hover:-translate-y-0.5 group-hover:shadow-xl">
            <Utensils size={21} />
          </span>

          <span className="min-w-0">
            <span className="block truncate text-[11px] font-black uppercase tracking-[.24em] text-[#087443]">
              Ambo Menafesha
            </span>

            <span className="mt-0.5 block truncate text-lg font-black text-[#052e1a] sm:text-xl">
              {title}
            </span>
          </span>
        </button>

        <nav className="pointer-events-auto relative z-[102] flex shrink-0 items-center gap-2 rounded-2xl border border-[#064e2b]/10 bg-white/90 p-1.5 shadow-sm">
          {role === "admin" ? (
            <button
              type="button"
              onClick={switchPage}
              disabled={switchingPage || loggingOut}
              className="pointer-events-auto inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#052e1a] px-3 py-2.5 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#064e2b] disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
            >
              {switchingPage ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <SwitchIcon size={17} />
              )}

              <span>
                {switchingPage
                  ? "Opening..."
                  : switchLabel}
              </span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-xl bg-[#052e1a] px-3 py-2.5 text-sm font-black text-white shadow-md sm:px-4">
              <Users size={17} />

              <span className="hidden sm:inline">
                Staff
              </span>
            </div>
          )}

          <div className="mx-1 hidden h-7 w-px bg-[#064e2b]/10 sm:block" />

          <button
            type="button"
            onClick={logout}
            disabled={loggingOut || switchingPage}
            className="pointer-events-auto inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-black text-red-700 transition hover:border-red-300 hover:bg-red-100 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
            title="Logout"
            aria-label="Logout"
          >
            {loggingOut ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              <LogOut size={17} />
            )}

            <span className="hidden sm:inline">
              {loggingOut
                ? "Logging out..."
                : "Logout"}
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
}