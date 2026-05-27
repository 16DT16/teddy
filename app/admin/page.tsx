"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TopNav } from "@/components/TopNav";
import {
  AlertCircle,
  CheckCircle2,
  CircleDollarSign,
  Coffee,
  Home,
  Loader2,
  ReceiptText,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";

type Summary = {
  byGojo: any[];
  productTotals: any[];
  totals: any;
};

type Notice = {
  type: "success" | "error" | "info";
  text: string;
};

async function readJsonSafe(url: string) {
  const res = await fetch(url, {
    cache: "no-store",
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || `${url} failed with status ${res.status}`);
  }

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${url} returned invalid JSON.`);
  }
}

function formatMoney(value: any) {
  return `${Number(value || 0).toFixed(0)} ETB`;
}

function formatNumber(value: any) {
  return Number(value || 0).toLocaleString();
}

export default function AdminPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const loadingRef = useRef(false);

  async function load(manual = false) {
    if (loadingRef.current) return;

    loadingRef.current = true;

    try {
      if (manual) setRefreshing(true);
      setNotice(null);

      const data = await readJsonSafe("/api/summary");

      setSummary({
        byGojo: Array.isArray(data.byGojo) ? data.byGojo : [],
        productTotals: Array.isArray(data.productTotals)
          ? data.productTotals
          : [],
        totals: data.totals || {},
      });

      if (manual) {
        setNotice({
          type: "success",
          text: "Dashboard refreshed successfully.",
        });
      }
    } catch (error: any) {
      console.error("Failed to load admin dashboard:", error);

      setNotice({
        type: "error",
        text:
          error?.message ||
          "Failed to load admin dashboard. Please refresh again.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      loadingRef.current = false;
    }
  }

  useEffect(() => {
    load(false);

    const timer = setInterval(() => {
      load(false);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const activeGojos = useMemo(() => {
    return summary?.byGojo?.filter((row) => Number(row.grandTotal || 0) > 0) || [];
  }, [summary]);

  const topGojo = useMemo(() => {
    const rows = summary?.byGojo || [];

    if (!rows.length) return null;

    return [...rows].sort(
      (a, b) => Number(b.grandTotal || 0) - Number(a.grandTotal || 0)
    )[0];
  }, [summary]);

  const totalPeople = useMemo(() => {
    return (
      summary?.byGojo?.reduce(
        (sum, row) => sum + Number(row.peopleCount || 0),
        0
      ) || 0
    );
  }, [summary]);

  const totalQuantity = useMemo(() => {
    return (
      summary?.productTotals?.reduce(
        (sum, product) => sum + Number(product.quantity || 0),
        0
      ) || 0
    );
  }, [summary]);

  const orderTotal = Number(summary?.totals?.orderTotal || 0);
  const seatTotal = Number(summary?.totals?.seatTotal || 0);
  const grandTotal = Number(summary?.totals?.grandTotal || 0);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(215,169,52,0.14),transparent_34%),linear-gradient(135deg,#f5f7ef,#e8f5ec_45%,#f7f3df)] pb-10">
      <TopNav title="Admin Dashboard" />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 overflow-hidden rounded-[2rem] bg-[#052e1a] shadow-2xl sm:rounded-[2.75rem]">
          <div className="relative p-6 text-white sm:p-8 lg:p-10">
            <div className="absolute right-[-80px] top-[-90px] h-64 w-64 rounded-full bg-[#d7a934]/20 blur-3xl" />
            <div className="absolute bottom-[-100px] left-[-80px] h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

            <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[.22em] text-[#f5d36a]">
                  <TrendingUp size={15} />
                  Owner control center
                </div>

                <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
                  Teddy Menafesha daily dashboard
                </h1>

                <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/70 sm:text-base">
                  Monitor each gojo/home, classified product sales, seat
                  charges, and today&apos;s full payment total in one place.
                </p>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur sm:min-w-[330px]">
                <p className="text-sm font-bold text-white/60">
                  Today grand total
                </p>

                <p className="mt-2 text-4xl font-black text-[#f5d36a]">
                  {loading ? "..." : formatMoney(grandTotal)}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <p className="text-white/50">People</p>
                    <p className="font-black">{formatNumber(totalPeople)}</p>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-3">
                    <p className="text-white/50">Items</p>
                    <p className="font-black">{formatNumber(totalQuantity)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {notice && (
          <div
            className={`mb-5 flex items-start gap-3 rounded-[1.5rem] border px-5 py-4 text-sm font-bold shadow-sm ${
              notice.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : notice.type === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {notice.type === "success" ? (
              <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={20} className="mt-0.5 shrink-0" />
            )}

            <span>{notice.text}</span>
          </div>
        )}

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.24em] text-[#087443]">
              Live financial overview
            </p>
            <h2 className="mt-1 text-2xl font-black text-[#052e1a]">
              Today&apos;s totals
            </h2>
          </div>

          <button
            type="button"
            onClick={() => load(true)}
            disabled={refreshing}
            className="btn-primary w-full rounded-2xl px-5 py-3 font-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {refreshing ? (
              <>
                <Loader2 size={18} className="mr-2 inline animate-spin" />
                Refreshing
              </>
            ) : (
              <>
                <RefreshCw size={18} className="mr-2 inline" />
                Refresh Dashboard
              </>
            )}
          </button>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="soft-card animate-pulse rounded-[2rem] p-6"
              >
                <div className="h-4 w-32 rounded-full bg-[#064e2b]/10" />
                <div className="mt-4 h-9 w-48 rounded-full bg-[#064e2b]/10" />
                <div className="mt-3 h-4 w-28 rounded-full bg-[#064e2b]/10" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="soft-card rounded-[2rem] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-sm font-black text-[#087443]">
                    <CircleDollarSign size={18} />
                    Orders
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-[#052e1a]">
                    {formatMoney(orderTotal)}
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-[#064e2b]/55">
                    Food and drink order total
                  </p>
                </div>

                <div className="rounded-2xl bg-[#064e2b]/8 p-3 text-[#064e2b]">
                  <ReceiptText size={24} />
                </div>
              </div>
            </div>

            <div className="soft-card rounded-[2rem] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-sm font-black text-[#087443]">
                    <Users size={18} />
                    Seat charges
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-[#052e1a]">
                    {formatMoney(seatTotal)}
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-[#064e2b]/55">
                    People count × seat price
                  </p>
                </div>

                <div className="rounded-2xl bg-[#064e2b]/8 p-3 text-[#064e2b]">
                  <Users size={24} />
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-[#052e1a] p-6 text-white shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-sm font-black text-[#d7a934]">
                    <Home size={18} />
                    Grand total
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-[#f5d36a]">
                    {formatMoney(grandTotal)}
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-white/55">
                    Full payment expected today
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-3 text-[#f5d36a]">
                  <TrendingUp size={24} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="soft-card overflow-hidden rounded-[2rem]">
            <div className="flex flex-col gap-3 border-b border-[#064e2b]/10 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[.22em] text-[#087443]">
                  Gojo/Home control
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#052e1a]">
                  Gojo/Home totals
                </h2>
              </div>

              <div className="rounded-2xl bg-[#064e2b]/8 px-4 py-3 text-sm font-black text-[#064e2b]">
                {activeGojos.length} active gojo{activeGojos.length === 1 ? "" : "s"}
              </div>
            </div>

            {loading ? (
              <div className="space-y-3 p-5">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-16 animate-pulse rounded-2xl bg-[#064e2b]/8"
                  />
                ))}
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-[#064e2b]/8 text-[#064e2b]">
                      <tr>
                        <th className="p-4">Gojo</th>
                        <th className="p-4">People</th>
                        <th className="p-4">Seat price</th>
                        <th className="p-4">Order total</th>
                        <th className="p-4">Seat total</th>
                        <th className="p-4">Total payment</th>
                      </tr>
                    </thead>

                    <tbody>
                      {summary?.byGojo?.map((row) => (
                        <tr
                          key={row.gojo.id}
                          className="border-t border-[#064e2b]/10 hover:bg-[#f7fbf2]"
                        >
                          <td className="p-4 font-black text-[#052e1a]">
                            {row.gojo.name}
                          </td>

                          <td className="p-4 font-bold text-[#064e2b]/75">
                            {formatNumber(row.peopleCount)}
                          </td>

                          <td className="p-4 font-bold text-[#064e2b]/75">
                            {formatMoney(row.seatPrice)}
                          </td>

                          <td className="p-4 font-bold text-[#064e2b]/75">
                            {formatMoney(row.orderTotal)}
                          </td>

                          <td className="p-4 font-bold text-[#064e2b]/75">
                            {formatMoney(row.seatTotal)}
                          </td>

                          <td className="p-4 font-black text-[#087443]">
                            {formatMoney(row.grandTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 p-5 lg:hidden">
                  {summary?.byGojo?.map((row) => (
                    <div
                      key={row.gojo.id}
                      className="rounded-[1.5rem] border border-[#064e2b]/10 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-[#052e1a]">
                            {row.gojo.name}
                          </p>

                          <p className="mt-1 text-xs font-bold text-[#064e2b]/55">
                            People: {formatNumber(row.peopleCount)} · Seat:{" "}
                            {formatMoney(row.seatPrice)}
                          </p>
                        </div>

                        <p className="text-right font-black text-[#087443]">
                          {formatMoney(row.grandTotal)}
                        </p>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-2xl bg-[#f7fbf2] p-3">
                          <p className="text-xs font-bold text-[#064e2b]/45">
                            Orders
                          </p>
                          <p className="font-black text-[#052e1a]">
                            {formatMoney(row.orderTotal)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-[#f7fbf2] p-3">
                          <p className="text-xs font-bold text-[#064e2b]/45">
                            Seat total
                          </p>
                          <p className="font-black text-[#052e1a]">
                            {formatMoney(row.seatTotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {!summary?.byGojo?.length && (
                  <div className="p-8 text-center">
                    <p className="text-lg font-black text-[#052e1a]">
                      No gojo data yet
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#064e2b]/60">
                      Once staff enters gojo billing or orders arrive, totals
                      will appear here.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <aside className="space-y-6">
            <div className="soft-card rounded-[2rem] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.22em] text-[#087443]">
                    Classified totals
                  </p>

                  <h2 className="mt-2 flex items-center gap-2 text-2xl font-black text-[#052e1a]">
                    <Coffee />
                    Products
                  </h2>
                </div>

                <div className="rounded-2xl bg-[#064e2b]/8 p-3 text-[#064e2b]">
                  <Coffee size={24} />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {loading &&
                  [1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-20 animate-pulse rounded-2xl bg-[#064e2b]/8"
                    />
                  ))}

                {!loading &&
                  summary?.productTotals?.map((product) => (
                    <div
                      key={product.name}
                      className="rounded-2xl border border-[#064e2b]/10 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-black text-[#052e1a]">
                            {product.name}
                          </p>

                          <p className="mt-1 text-sm font-semibold text-[#064e2b]/65">
                            {product.category} · quantity{" "}
                            {formatNumber(product.quantity)}
                          </p>
                        </div>

                        <p className="text-right font-black text-[#087443]">
                          {formatMoney(product.total)}
                        </p>
                      </div>
                    </div>
                  ))}

                {!loading && !summary?.productTotals?.length && (
                  <div className="rounded-[1.5rem] bg-white p-5 text-center">
                    <p className="font-black text-[#052e1a]">
                      No product sales yet
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#064e2b]/60">
                      Classified totals will appear after orders are placed.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] bg-[#052e1a] p-5 text-white shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[.2em] text-[#f5d36a]">
                Top gojo/home
              </p>

              {topGojo ? (
                <>
                  <h3 className="mt-3 text-2xl font-black">
                    {topGojo.gojo.name}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-white/60">
                    Highest total payment today
                  </p>

                  <div className="mt-5 rounded-[1.5rem] bg-white/10 p-4">
                    <p className="text-sm font-bold text-white/55">
                      Total payment
                    </p>
                    <p className="mt-1 text-3xl font-black text-[#f5d36a]">
                      {formatMoney(topGojo.grandTotal)}
                    </p>
                  </div>
                </>
              ) : (
                <p className="mt-3 text-sm font-semibold text-white/60">
                  No gojo totals available yet.
                </p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}