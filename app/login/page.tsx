"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Coffee,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";

type Role = "staff" | "admin";

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();

  const defaultRole: Role = params.get("role") === "admin" ? "admin" : "staff";

  const [role, setRole] = useState<Role>(defaultRole);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRole(defaultRole);
  }, [defaultRole]);

  const portalTitle = useMemo(() => {
    return role === "admin" ? "Admin Dashboard" : "Staff Portal";
  }, [role]);

  const portalDescription = useMemo(() => {
    return role === "admin"
      ? "የቀኑን ገቢ፣ የጎጆ ክፍያ፣ እና የትዕዛዝ ድምር ይቆጣጠሩ።"
      : "ትዕዛዞችን ይቀበሉ፣ ሁኔታ ያዘምኑ፣ እና የጎጆ ክፍያ ያስገቡ።";
  }, [role]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          role,
        }),
      });

      const text = await res.text();

      if (!res.ok) {
        let message = "Wrong username or password.";

        try {
          const data = text ? JSON.parse(text) : {};
          message = data.error || data.message || message;
        } catch {
          message = text || message;
        }

        throw new Error(message);
      }

      router.replace(role === "admin" ? "/admin" : "/staff");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(215,169,52,0.16),transparent_34%),linear-gradient(135deg,#f5f7ef,#e8f5ec_45%,#f7f3df)] px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-48px)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-2xl lg:grid-cols-[1fr_460px]">
          <div className="relative hidden bg-[#052e1a] p-10 text-white lg:block">
            <div className="absolute right-[-100px] top-[-100px] h-80 w-80 rounded-full bg-[#d7a934]/25 blur-3xl" />
            <div className="absolute bottom-[-120px] left-[-90px] h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />

            <div className="relative z-10 flex h-full min-h-[620px] flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[.24em] text-[#f5d36a]">
                  <Coffee size={15} />
                  Teddy Menafesha
                </div>

                <h1 className="mt-8 max-w-xl text-5xl font-black tracking-tight">
                  የሰራተኞች እና የአስተዳዳሪ መግቢያ
                </h1>

                <p className="mt-5 max-w-md text-base font-medium leading-7 text-white/70">
                  ትዕዛዞችን፣ የጎጆ ክፍያዎችን እና የቀኑን ገቢ በአንድ ቦታ በቀላሉ
                  ለመቆጣጠር ይግቡ።
                </p>
              </div>

              <div className="grid gap-3">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <ShieldCheck className="text-[#f5d36a]" size={24} />
                  <p className="mt-3 font-black">Secure portal access</p>
                  <p className="mt-1 text-sm font-semibold text-white/55">
                    Staff and admin pages are protected by login.
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <Users className="text-[#f5d36a]" size={24} />
                  <p className="mt-3 font-black">Daily operations</p>
                  <p className="mt-1 text-sm font-semibold text-white/55">
                    Manage orders, gojo billing, and daily totals.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#ecfff4] px-4 py-2 text-xs font-black uppercase tracking-[.2em] text-[#087443]">
                <LockKeyhole size={15} />
                Secure Portal
              </div>

              <h2 className="mt-5 text-4xl font-black tracking-tight text-[#052e1a]">
                {portalTitle}
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-[#064e2b]/65">
                {portalDescription}
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-black text-[#064e2b]">
                  Portal
                </label>

                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#f7fbf2] p-1">
                  <button
                    type="button"
                    onClick={() => setRole("staff")}
                    className={`rounded-xl px-4 py-3 text-sm font-black transition ${
                      role === "staff"
                        ? "bg-[#052e1a] text-white shadow-sm"
                        : "text-[#064e2b] hover:bg-white"
                    }`}
                  >
                    Staff
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`rounded-xl px-4 py-3 text-sm font-black transition ${
                      role === "admin"
                        ? "bg-[#052e1a] text-white shadow-sm"
                        : "text-[#064e2b] hover:bg-white"
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#064e2b]">
                  <User size={17} />
                  Username
                </span>

                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  placeholder="Enter username"
                  className="w-full rounded-2xl border border-[#064e2b]/15 bg-[#fbfdf8] px-4 py-3 font-bold text-[#052e1a] outline-none transition placeholder:text-[#064e2b]/35 focus:border-[#087443] focus:ring-4 focus:ring-green-900/10"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#064e2b]">
                  <LockKeyhole size={17} />
                  Password
                </span>

                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter password"
                  className="w-full rounded-2xl border border-[#064e2b]/15 bg-[#fbfdf8] px-4 py-3 font-bold text-[#052e1a] outline-none transition placeholder:text-[#064e2b]/35 focus:border-[#087443] focus:ring-4 focus:ring-green-900/10"
                />
              </label>

              {error && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  <AlertCircle size={20} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !username.trim() || !password.trim()}
                className="mt-2 w-full rounded-2xl bg-[#052e1a] px-5 py-3.5 font-black text-white shadow-lg shadow-[#052e1a]/15 transition hover:-translate-y-0.5 hover:bg-[#064e2b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="mr-2 inline animate-spin" />
                    Opening...
                  </>
                ) : (
                  "Open Portal"
                )}
              </button>
            </form>

            <div className="mt-6 rounded-[1.5rem] border border-[#064e2b]/10 bg-[#f7fbf2] p-4">
              <p className="text-sm font-bold leading-6 text-[#064e2b]/70">
                Use the predefined username and password configured in your
                Vercel environment variables.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f3f7ed]">
          <div className="rounded-[2rem] bg-white p-8 text-center shadow-xl">
            <Loader2 className="mx-auto animate-spin text-[#087443]" size={34} />
            <p className="mt-4 font-black text-[#052e1a]">Loading login...</p>
          </div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}