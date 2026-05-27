"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Coffee,
  Copy,
  Download,
  Home,
  Loader2,
  MessageSquareText,
  Plus,
  QrCode,
  ReceiptText,
  Send,
  Share2,
  ShoppingBag,
} from "lucide-react";

type Gojo = {
  id: string;
  number: number;
  name: string;
};

type Product = {
  id: string;
  name: string;
  category: string;
  price: string;
  unit: string;
};

type Notice = {
  type: "success" | "error" | "info";
  text: string;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
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

function formatMoney(value: number) {
  return `${Number(value || 0).toFixed(0)} ብር`;
}

function translateCategory(category: string) {
  const value = category?.toLowerCase();

  if (value?.includes("coffee")) return "ቡና";
  if (value?.includes("tea")) return "ሻይ";
  if (value?.includes("drink")) return "መጠጥ";
  if (value?.includes("soft")) return "ለስላሳ";
  if (value?.includes("food")) return "ምግብ";
  if (value?.includes("water")) return "ውሃ";

  return category || "ሌላ";
}

function translateUnit(unit: string) {
  const value = unit?.toLowerCase();

  if (value === "item") return "እቃ";
  if (value === "cup") return "ኩባያ";
  if (value === "bottle") return "ጠርሙስ";
  if (value === "plate") return "ሰሃን";

  return unit || "እቃ";
}

export default function CustomerOrderPage() {
  const [gojos, setGojos] = useState<Gojo[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [gojoId, setGojoId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [customerText, setCustomerText] = useState("");

  const [notice, setNotice] = useState<Notice | null>(null);
  const [bootLoading, setBootLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [appUrl, setAppUrl] = useState("");
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);
  const [copied, setCopied] = useState(false);

  async function loadBootstrap() {
    try {
      setBootLoading(true);
      setNotice(null);

      const data = await readJsonSafe("/api/bootstrap");

      const nextGojos: Gojo[] = Array.isArray(data.gojos) ? data.gojos : [];
      const nextProducts: Product[] = Array.isArray(data.products)
        ? data.products
        : [];

      setGojos(nextGojos);
      setProducts(nextProducts);

      setGojoId((current) => current || nextGojos[0]?.id || "");
      setProductId((current) => current || nextProducts[0]?.id || "");

      if (!nextGojos.length || !nextProducts.length) {
        setNotice({
          type: "error",
          text: "የጎጆ ወይም የሜኑ ዝርዝር ባዶ ነው። እባክዎ ሰራተኞችን ያሳውቁ።",
        });
      }
    } catch (error: any) {
      console.error("Failed to load customer page:", error);

      setNotice({
        type: "error",
        text:
          error?.message ||
          "ሜኑውን መጫን አልተቻለም። እባክዎ ገጹን ያድሱ ወይም ሰራተኛ ያነጋግሩ።",
      });
    } finally {
      setBootLoading(false);
    }
  }

  useEffect(() => {
    loadBootstrap();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setAppUrl(window.location.origin);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const selectedProduct = useMemo(() => {
    return products.find((product) => product.id === productId);
  }, [products, productId]);

  const selectedGojo = useMemo(() => {
    return gojos.find((gojo) => gojo.id === gojoId);
  }, [gojos, gojoId]);

  const normalizedQuantity = Number.isFinite(quantity)
    ? Math.min(Math.max(quantity, 1), 99)
    : 1;

  const total = Number(selectedProduct?.price || 0) * normalizedQuantity;

  const qrCodeUrl = useMemo(() => {
    const target = appUrl || "http://localhost:3000";

    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=14&data=${encodeURIComponent(
      target
    )}`;
  }, [appUrl]);

  const groupedProducts = useMemo(() => {
    const groups = new Map<string, Product[]>();

    for (const product of products) {
      const key = product.category || "ሌላ";
      const existing = groups.get(key) || [];
      existing.push(product);
      groups.set(key, existing);
    }

    return Array.from(groups.entries()).map(([category, items]) => ({
      category,
      items,
    }));
  }, [products]);

  async function installApp() {
    try {
      if (!installPrompt) {
        setNotice({
          type: "info",
          text: "ለመጫን፡ ይህን ገጽ በChrome ይክፈቱ፣ ከዚያ ‘Install App’ ወይም ‘Add to Home Screen’ ይምረጡ።",
        });
        return;
      }

      setInstalling(true);

      await installPrompt.prompt();

      const choice = await installPrompt.userChoice;

      if (choice.outcome === "accepted") {
        setNotice({
          type: "success",
          text: "መተግበሪያው መጫን ጀምሯል።",
        });
        setInstallPrompt(null);
      } else {
        setNotice({
          type: "info",
          text: "መጫኑ ተሰርዟል። በኋላ መጫን ይችላሉ።",
        });
      }
    } catch {
      setNotice({
        type: "error",
        text: "መጫን አልተቻለም። ከBrowser Menu ‘Add to Home Screen’ ይጠቀሙ።",
      });
    } finally {
      setInstalling(false);
    }
  }

  async function copyLink() {
    try {
      const target = appUrl || window.location.href;

      await navigator.clipboard.writeText(target);

      setCopied(true);
      setNotice({
        type: "success",
        text: "የማዘዣ ሊንኩ ተቀድቷል።",
      });

      setTimeout(() => setCopied(false), 1500);
    } catch {
      setNotice({
        type: "error",
        text: "ሊንኩን መቅዳት አልተቻለም።",
      });
    }
  }

  async function shareApp() {
    try {
      const target = appUrl || window.location.href;

      if (navigator.share) {
        await navigator.share({
          title: "Teddy Menafesha Ordering",
          text: "የTeddy Menafesha ማዘዣ ገጽን ይክፈቱ።",
          url: target,
        });
      } else {
        await copyLink();
      }
    } catch {
      // share cancelled
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (!gojoId) {
      setNotice({
        type: "error",
        text: "እባክዎ የጎጆ/ቤት ቁጥር ይምረጡ።",
      });
      return;
    }

    if (!productId) {
      setNotice({
        type: "error",
        text: "እባክዎ ማዘዝ የሚፈልጉትን እቃ ይምረጡ።",
      });
      return;
    }

    try {
      setSubmitting(true);
      setNotice(null);

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gojoId,
          productId,
          quantity: normalizedQuantity,
          customerText: customerText.trim(),
        }),
      });

      const text = await res.text();

      if (!res.ok) {
        let message = "ትዕዛዙ አልተላከም። እባክዎ ሰራተኛ ያነጋግሩ።";

        try {
          const data = text ? JSON.parse(text) : {};
          message = data.error || data.message || message;
        } catch {
          message = text || message;
        }

        throw new Error(message);
      }

      setNotice({
        type: "success",
        text: "ትዕዛዙ ተልኳል። ሰራተኞች ተቀብለውታል።",
      });

      setQuantity(1);
      setCustomerText("");
    } catch (error: any) {
      setNotice({
        type: "error",
        text: error?.message || "ትዕዛዙ አልተላከም። እባክዎ ሰራተኛ ያነጋግሩ።",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f3f7ed] px-4 py-4 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <header className="mb-4 overflow-hidden rounded-[2rem] bg-[#052e1a] shadow-xl">
          <div className="relative px-5 py-6 text-white sm:px-7 lg:px-8">
            <div className="absolute right-[-60px] top-[-80px] h-52 w-52 rounded-full bg-[#d7a934]/25 blur-3xl" />
            <div className="absolute bottom-[-100px] left-[-60px] h-60 w-60 rounded-full bg-emerald-400/10 blur-3xl" />

            <div className="relative z-10 grid gap-5 lg:grid-cols-[1fr_280px] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[.22em] text-[#f5d36a]">
                  <Coffee size={14} />
                  Teddy Menafesha
                </div>

                <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
                  ከጎጆዎ በቀላሉ ይዘዙ።
                </h1>

                <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/72 sm:text-base">
                  ጎጆዎን ይምረጡ፣ ምግብ ወይም መጠጥ ይምረጡ፣ ትዕዛዝዎም ወዲያውኑ
                  ለሰራተኞች ይደርሳል።
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-bold text-white/55">ግምታዊ ዋጋ</p>
                <p className="mt-1 text-3xl font-black text-[#f5d36a]">
                  {formatMoney(total)}
                </p>

                <div className="mt-3 space-y-1 text-sm font-semibold text-white/70">
                  <p>ጎጆ፡ {selectedGojo?.name || "አልተመረጠም"}</p>
                  <p>እቃ፡ {selectedProduct?.name || "አልተመረጠም"}</p>
                  <p>ብዛት፡ {normalizedQuantity}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {notice && (
          <div
            className={`mb-4 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-bold shadow-sm ${
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

        <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
          <div className="space-y-4">
            <form
              onSubmit={submit}
              className="rounded-[2rem] border border-[#064e2b]/10 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.22em] text-[#087443]">
                    ትዕዛዝ ይላኩ
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-[#052e1a]">
                    ምን ማዘዝ ይፈልጋሉ?
                  </h2>
                </div>

                <div className="rounded-2xl bg-[#ecfff4] p-3 text-[#087443]">
                  <ShoppingBag size={24} />
                </div>
              </div>

              {bootLoading ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-[#064e2b]/15 bg-[#f7fbf2] p-6 text-center">
                  <Loader2 className="animate-spin text-[#087443]" size={32} />
                  <p className="mt-4 font-black text-[#052e1a]">
                    ሜኑ በመጫን ላይ...
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label>
                      <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#064e2b]">
                        <Home size={17} />
                        የጎጆ/ቤት ቁጥር
                      </span>

                      <select
                        value={gojoId}
                        onChange={(event) => setGojoId(event.target.value)}
                        className="w-full rounded-2xl border border-[#064e2b]/15 bg-[#fbfdf8] px-4 py-3 font-bold text-[#052e1a] outline-none transition focus:border-[#087443] focus:ring-4 focus:ring-green-900/10"
                      >
                        <option value="">ጎጆ/ቤት ይምረጡ</option>

                        {gojos.map((gojo) => (
                          <option key={gojo.id} value={gojo.id}>
                            {gojo.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#064e2b]">
                        <Coffee size={17} />
                        የትዕዛዝ አይነት
                      </span>

                      <select
                        value={productId}
                        onChange={(event) => setProductId(event.target.value)}
                        className="w-full rounded-2xl border border-[#064e2b]/15 bg-[#fbfdf8] px-4 py-3 font-bold text-[#052e1a] outline-none transition focus:border-[#087443] focus:ring-4 focus:ring-green-900/10"
                      >
                        <option value="">እቃ ይምረጡ</option>

                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} —{" "}
                            {formatMoney(Number(product.price || 0))}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-[160px_1fr]">
                    <label>
                      <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#064e2b]">
                        <Plus size={17} />
                        ብዛት
                      </span>

                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={quantity}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          setQuantity(Number.isFinite(value) ? value : 1);
                        }}
                        onBlur={() => setQuantity(normalizedQuantity)}
                        className="w-full rounded-2xl border border-[#064e2b]/15 bg-[#fbfdf8] px-4 py-3 font-bold text-[#052e1a] outline-none transition focus:border-[#087443] focus:ring-4 focus:ring-green-900/10"
                      />
                    </label>

                    <label>
                      <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#064e2b]">
                        <MessageSquareText size={17} />
                        ተጨማሪ ማስታወሻ
                      </span>

                      <input
                        value={customerText}
                        onChange={(event) => setCustomerText(event.target.value)}
                        maxLength={500}
                        placeholder="ምሳሌ፡ ቡና ያለ ስኳር፣ ከውሃ ጋር..."
                        className="w-full rounded-2xl border border-[#064e2b]/15 bg-[#fbfdf8] px-4 py-3 font-semibold text-[#052e1a] outline-none transition placeholder:text-[#064e2b]/35 focus:border-[#087443] focus:ring-4 focus:ring-green-900/10"
                      />
                    </label>
                  </div>

                  <div className="mt-5 rounded-[1.5rem] border border-[#064e2b]/10 bg-[#f7fbf2] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-white p-3 text-[#087443]">
                          <ReceiptText size={22} />
                        </div>

                        <div>
                          <p className="text-xs font-black uppercase tracking-[.16em] text-[#087443]">
                            የሚከፈል
                          </p>
                          <p className="text-2xl font-black text-[#052e1a]">
                            {formatMoney(total)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={
                          submitting ||
                          bootLoading ||
                          !gojoId ||
                          !productId ||
                          !products.length ||
                          !gojos.length
                        }
                        className="rounded-2xl bg-[#052e1a] px-6 py-3 font-black text-white shadow-lg shadow-[#052e1a]/15 transition hover:-translate-y-0.5 hover:bg-[#064e2b] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting ? (
                          <>
                            <Loader2
                              size={18}
                              className="mr-2 inline animate-spin"
                            />
                            በመላክ ላይ...
                          </>
                        ) : (
                          <>
                            <Send size={18} className="mr-2 inline" />
                            ትዕዛዝ ላክ
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </form>

            <div className="rounded-[2rem] border border-[#064e2b]/10 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.22em] text-[#087443]">
                    ፈጣን መክፈቻ
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-[#052e1a]">
                    QR እና መጫኛ
                  </h2>
                </div>

                <div className="rounded-2xl bg-[#ecfff4] p-3 text-[#087443]">
                  <QrCode size={24} />
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-[132px_1fr] sm:items-center">
                <div className="rounded-[1.25rem] border border-[#064e2b]/10 bg-[#f7fbf2] p-2">
                  <img
                    src={qrCodeUrl}
                    alt="Teddy Menafesha የማዘዣ QR Code"
                    className="mx-auto h-28 w-28 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold leading-6 text-[#064e2b]/70">
                    ይህን QR በጎጆዎች ላይ ያስቀምጡ። እንግዶች Scan አድርገው
                    በቀጥታ ማዘዝ ይችላሉ።
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={installApp}
                      disabled={installing}
                      className="rounded-2xl bg-[#052e1a] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#064e2b] disabled:opacity-60"
                    >
                      {installing ? (
                        <>
                          <Loader2
                            size={15}
                            className="mr-2 inline animate-spin"
                          />
                          በመጫን ላይ
                        </>
                      ) : (
                        <>
                          <Download size={15} className="mr-2 inline" />
                          ጫን
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={copyLink}
                      className="rounded-2xl bg-[#f7fbf2] px-4 py-2.5 text-sm font-black text-[#064e2b] transition hover:bg-[#ecfff4]"
                    >
                      <Copy size={15} className="mr-2 inline" />
                      {copied ? "ተቀድቷል" : "ቅዳ"}
                    </button>

                    <button
                      type="button"
                      onClick={shareApp}
                      className="rounded-2xl bg-[#ecfff4] px-4 py-2.5 text-sm font-black text-[#087443] transition hover:bg-[#dff8ea]"
                    >
                      <Share2 size={15} className="mr-2 inline" />
                      አጋራ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-[#064e2b]/10 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[.22em] text-[#087443]">
                  የዛሬ ሜኑ
                </p>
                <h2 className="mt-1 text-2xl font-black text-[#052e1a]">
                  ሜኑ
                </h2>
              </div>

              <div className="rounded-2xl bg-[#ecfff4] p-3 text-[#087443]">
                <Coffee size={24} />
              </div>
            </div>

            {bootLoading && (
              <div className="rounded-[1.5rem] bg-[#f7fbf2] p-5 text-center">
                <Loader2
                  size={24}
                  className="mx-auto animate-spin text-[#087443]"
                />
                <p className="mt-2 text-sm font-bold text-[#064e2b]/60">
                  ሜኑ በመጫን ላይ...
                </p>
              </div>
            )}

            {!bootLoading && groupedProducts.length === 0 && (
              <div className="rounded-[1.5rem] bg-[#f7fbf2] p-5 text-center">
                <p className="font-black text-[#052e1a]">ሜኑ የለም</p>
                <p className="mt-1 text-sm font-semibold text-[#064e2b]/60">
                  ሰራተኞች ምርቶችን መጨመር አለባቸው።
                </p>
              </div>
            )}

            <div className="space-y-4">
              {groupedProducts.map((group) => (
                <div key={group.category}>
                  <h3 className="mb-2 text-xs font-black uppercase tracking-[.18em] text-[#087443]">
                    {translateCategory(group.category)}
                  </h3>

                  <div className="space-y-2">
                    {group.items.map((product) => {
                      const isSelected = product.id === productId;

                      return (
                        <button
                          type="button"
                          key={product.id}
                          onClick={() => setProductId(product.id)}
                          className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                            isSelected
                              ? "border-[#087443] bg-[#ecfff4] shadow-sm"
                              : "border-[#064e2b]/8 bg-[#fbfdf8] hover:border-[#087443]/25 hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-black text-[#052e1a]">
                                {product.name}
                              </p>
                              <p className="text-xs font-semibold text-[#064e2b]/60">
                                {translateCategory(product.category)} · በ{" "}
                                {translateUnit(product.unit)}
                              </p>
                            </div>

                            <p className="shrink-0 font-black text-[#087443]">
                              {formatMoney(Number(product.price || 0))}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}