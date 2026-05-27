"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const defaultRole = params.get("role") === "admin" ? "admin" : "staff";
  const [role, setRole] = useState(defaultRole);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password, role }) });
    setLoading(false);
    if (!res.ok) { setError("Wrong username or password."); return; }
    router.push(role === "admin" ? "/admin" : "/staff");
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <form onSubmit={submit} className="soft-card w-full max-w-md rounded-[2rem] p-8">
        <div className="mb-7 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#064e2b] text-white"><LockKeyhole /></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[.24em] text-[#087443]">Secure Portal</p>
            <h1 className="text-2xl font-black text-[#052e1a]">Login</h1>
          </div>
        </div>
        <label className="mb-2 block text-sm font-bold text-[#064e2b]">Portal</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="mb-4 w-full rounded-2xl border border-[#064e2b]/15 bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-green-900/10">
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
        <label className="mb-2 block text-sm font-bold text-[#064e2b]">Username</label>
        <input value={username} onChange={e => setUsername(e.target.value)} className="mb-4 w-full rounded-2xl border border-[#064e2b]/15 bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-green-900/10" />
        <label className="mb-2 block text-sm font-bold text-[#064e2b]">Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mb-5 w-full rounded-2xl border border-[#064e2b]/15 bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-green-900/10" />
        {error && <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
        <button disabled={loading} className="btn-primary w-full rounded-2xl px-5 py-3 font-black transition disabled:opacity-60">{loading ? "Opening..." : "Open Portal"}</button>
      </form>
    </main>
  );
}
