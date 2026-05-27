"use client";
import Link from "next/link";
import { LogOut, Shield, Utensils } from "lucide-react";
import { useRouter } from "next/navigation";

export function TopNav({ title }: { title: string }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
      <Link href="/" className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#064e2b] text-white shadow-lg"><Utensils size={20} /></span>
        <span>
          <span className="block text-xs font-semibold uppercase tracking-[.28em] text-[#087443]">Teddy Menafesha</span>
          <span className="block text-xl font-black text-[#052e1a]">{title}</span>
        </span>
      </Link>
      <nav className="flex items-center gap-2">
        <Link className="rounded-xl px-3 py-2 text-sm font-bold text-[#064e2b] hover:bg-white/70" href="/staff">Staff</Link>
        <Link className="rounded-xl px-3 py-2 text-sm font-bold text-[#064e2b] hover:bg-white/70" href="/admin"><Shield size={16} className="inline" /> Admin</Link>
        <button onClick={logout} className="rounded-xl p-2 text-[#064e2b] hover:bg-white/70" title="Logout"><LogOut size={18} /></button>
      </nav>
    </header>
  );
}
