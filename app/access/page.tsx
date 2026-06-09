"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchJson } from "@/lib/client-api";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Coffee,
  Home,
  KeyRound,
  Loader2,
  LockKeyhole,
  MapPin,
  QrCode,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  X,
} from "lucide-react";

type Gojo = {
  id: string;
  number: number | string;
  name?: string | null;
  active?: boolean;
};

type GojoListResponse = {
  gojos?: Gojo[];
  error?: string;
  retryable?: boolean;
};

type VerifyResponse = {
  ok?: boolean;
  redirectTo?: string;
  gojo?: Gojo;
  error?: string;
};

type ConnectionState =
  | "online"
  | "slow"
  | "offline"
  | "retrying";

const GOJO_CACHE_KEY =
  "ambo_access_gojos_v1";

function getGojoLabel(gojo: Gojo) {
  if (gojo.name?.trim()) {
    return gojo.name.trim();
  }

  return `ጎጆ ${gojo.number}`;
}

export default function AccessPage() {
  const router = useRouter();

  const [gojos, setGojos] = useState<Gojo[]>([]);
  const [selectedGojoId, setSelectedGojoId] =
    useState("");
  const [code, setCode] = useState("");
  const [loadingGojos, setLoadingGojos] =
    useState(true);
  const [verifying, setVerifying] =
    useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] =
    useState(false);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("online");
  const [lastUpdatedAt, setLastUpdatedAt] =
    useState<Date | null>(null);
  const [scannerOpen, setScannerOpen] =
    useState(false);
  const [scannerLoading, setScannerLoading] =
    useState(false);
  const scannerRef = useRef<any>(null);

  const selectedGojo = useMemo(
    () =>
      gojos.find(
        (gojo) => gojo.id === selectedGojoId,
      ) || null,
    [gojos, selectedGojoId],
  );

  function applyGojoData(
    items: Gojo[],
  ) {
    const activeGojos =
      items.filter(
        (gojo) =>
          gojo.active !== false,
      );

    setGojos(activeGojos);

    const params =
      new URLSearchParams(
        window.location.search,
      );

    const gojoFromQr =
      params.get("gojo") || "";

    const codeFromQr = (
      params.get("code") || ""
    )
      .replace(/\D/g, "")
      .slice(0, 6);

    const qrGojoExists =
      activeGojos.some(
        (gojo) =>
          gojo.id === gojoFromQr,
      );

    if (qrGojoExists) {
      setSelectedGojoId(
        gojoFromQr,
      );
    } else if (
      activeGojos.length > 0
    ) {
      setSelectedGojoId(
        (current) =>
          activeGojos.some(
            (gojo) =>
              gojo.id === current,
          )
            ? current
            : activeGojos[0].id,
      );
    }

    if (
      codeFromQr.length === 6
    ) {
      setCode(codeFromQr);
    }

    return activeGojos;
  }

  async function loadGojos(
    showLoader = true,
  ) {
    if (showLoader) {
      setLoadingGojos(true);
    }

    setError("");
    setConnectionState("retrying");

    try {
      const data =
  await fetchJson<GojoListResponse>(
    "/api/gojos",
    {
      timeoutMs: 12000,
    },
  );

      const activeGojos =
        applyGojoData(
          Array.isArray(data.gojos)
            ? data.gojos
            : [],
        );

      localStorage.setItem(
        GOJO_CACHE_KEY,
        JSON.stringify(
          activeGojos,
        ),
      );

      setConnectionState("online");
      setLastUpdatedAt(new Date());

      if (
        activeGojos.length === 0
      ) {
        setError(
          "ምንም የሚገኝ ጎጆ የለም። እባክዎ ሰራተኛውን ያነጋግሩ።",
        );
      }

      return true;
    } catch (err) {
      const online =
        typeof navigator ===
          "undefined" ||
        navigator.onLine;

      setConnectionState(
        online ? "slow" : "offline",
      );

      const hasCachedGojos =
        gojos.length > 0;

      setError(
        hasCachedGojos
          ? online
            ? "ግንኙነቱ ዘግይቷል። የመጨረሻው የጎጆ ዝርዝር እየታየ ነው።"
            : "የኢንተርኔት ግንኙነት የለም። የመጨረሻው የጎጆ ዝርዝር እየታየ ነው።"
          : err instanceof Error
            ? err.message
            : "ጎጆዎቹን ማግኘት አልተቻለም።",
      );

      return false;
    } finally {
      setLoadingGojos(false);
    }
  }

  useEffect(() => {
    let retryTimer:
      | ReturnType<typeof setTimeout>
      | null = null;

    try {
      const cached =
        localStorage.getItem(
          GOJO_CACHE_KEY,
        );

      if (cached) {
        const parsed =
          JSON.parse(cached);

        if (Array.isArray(parsed)) {
          applyGojoData(parsed);
          setLoadingGojos(false);
        }
      }
    } catch {
      localStorage.removeItem(
        GOJO_CACHE_KEY,
      );
    }

    async function initialLoad() {
      const success =
        await loadGojos(
          gojos.length === 0,
        );

      if (!success) {
        retryTimer = setTimeout(
          () => {
            void loadGojos(false);
          },
          15000,
        );
      }
    }

    function handleOnline() {
      setConnectionState("retrying");
      void loadGojos(false);
    }

    function handleOffline() {
      setConnectionState("offline");

      setError(
        "የኢንተርኔት ግንኙነት ተቋርጧል። የመጨረሻው የጎጆ ዝርዝር እየታየ ነው።",
      );
    }

    window.addEventListener(
      "online",
      handleOnline,
    );

    window.addEventListener(
      "offline",
      handleOffline,
    );

    void initialLoad();

    return () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
      }

      window.removeEventListener(
        "online",
        handleOnline,
      );

      window.removeEventListener(
        "offline",
        handleOffline,
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCodeChange(
    value: string,
  ) {
    const digitsOnly = value
      .replace(/\D/g, "")
      .slice(0, 6);

    setCode(digitsOnly);

    if (error) {
      setError("");
    }
  }

  function applyScannedQrValue(scannedValue: string) {
    try {
      const scannedUrl = new URL(
        scannedValue,
        window.location.origin,
      );

      const scannedGojoId =
        scannedUrl.searchParams.get("gojo") || "";

      const scannedCode = (
        scannedUrl.searchParams.get("code") || ""
      )
        .replace(/\D/g, "")
        .slice(0, 6);

      const gojoExists = gojos.some(
        (gojo) => gojo.id === scannedGojoId,
      );

      if (!gojoExists || scannedCode.length !== 6) {
        throw new Error(
          "ይህ QR ኮድ ትክክለኛ የጎጆ መግቢያ አይደለም።",
        );
      }

      setSelectedGojoId(scannedGojoId);
      setCode(scannedCode);
      setError("");
      setSuccess(false);

      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "QR ኮዱን ማንበብ አልተቻለም።",
      );

      return false;
    }
  }

  async function stopScanner() {
    const scanner = scannerRef.current;

    scannerRef.current = null;

    if (scanner) {
      try {
        const state = scanner.getState?.();

        if (state === 2 || state === 3) {
          await scanner.stop();
        }
      } catch (error) {
        console.warn("QR scanner stop failed:", error);
      }

      try {
        await scanner.clear();
      } catch {
        // The scanner may already be cleared.
      }
    }

    setScannerOpen(false);
    setScannerLoading(false);
  }

  async function openScanner() {
    if (scannerOpen || scannerLoading) {
      return;
    }

    setError("");
    setScannerOpen(true);
    setScannerLoading(true);

    try {
      const { Html5Qrcode } = await import(
        "html5-qrcode"
      );

      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => {
          resolve();
        });
      });

      const scanner = new Html5Qrcode(
        "gojo-qr-reader",
      );

      scannerRef.current = scanner;

      await scanner.start(
        {
          facingMode: "environment",
        },
        {
          fps: 10,
          qrbox: {
            width: 240,
            height: 240,
          },
          aspectRatio: 1,
        },
        async (decodedText) => {
          const accepted =
            applyScannedQrValue(decodedText);

          if (accepted) {
            await stopScanner();
          }
        },
        () => {
          // QR frames without a result are expected.
        },
      );
    } catch (err) {
      console.error("Unable to start QR scanner:", err);

      setError(
        err instanceof Error
          ? err.message
          : "ካሜራውን መክፈት አልተቻለም።",
      );

      await stopScanner();
    } finally {
      setScannerLoading(false);
    }
  }

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;

      if (scanner) {
        scanner.stop().catch(() => {});
        scanner.clear().catch(() => {});
      }
    };
  }, []);

  async function submit(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (!selectedGojoId) {
      setError("እባክዎ ጎጆ ይምረጡ።");
      return;
    }

    if (code.length !== 6) {
      setError(
        "የቀኑን 6 አሃዝ የይለፍ ቃል ያስገቡ።",
      );
      return;
    }

    try {
      setVerifying(true);
      setError("");
      setSuccess(false);

      if (
        typeof navigator !==
          "undefined" &&
        !navigator.onLine
      ) {
        setConnectionState(
          "offline",
        );

        throw new Error(
          "የኢንተርኔት ግንኙነት የለም። እባክዎ ግንኙነቱ ሲመለስ እንደገና ይሞክሩ።",
        );
      }

      setConnectionState(
        "retrying",
      );

      const data =
        await fetchJson<VerifyResponse>(
          "/api/gojo-access/verify",
          {
            method: "POST",
            timeoutMs: 12000,
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              gojoId:
                selectedGojoId,
              code,
            }),
          },
        );

      setConnectionState("online");

      setSuccess(true);

      const redirectTo =
        data.redirectTo ||
        `/?gojo=${encodeURIComponent(
          selectedGojoId,
        )}`;

      router.replace(redirectTo);
    } catch (err) {
      const online =
        typeof navigator ===
          "undefined" ||
        navigator.onLine;

      setConnectionState(
        online ? "slow" : "offline",
      );

      setError(
        err instanceof Error
          ? err.message
          : "የይለፍ ቃሉን ማረጋገጥ አልተቻለም።",
      );
    } finally {
      setVerifying(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(215,169,52,0.18),transparent_34%),linear-gradient(135deg,#f5f7ef,#e8f5ec_45%,#f7f3df)] px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-48px)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-2xl lg:grid-cols-[1fr_460px]">
          <div className="relative hidden overflow-hidden bg-[#052e1a] p-10 text-white lg:block">
            <div className="absolute right-[-110px] top-[-110px] h-80 w-80 rounded-full bg-[#d7a934]/25 blur-3xl" />
            <div className="absolute bottom-[-130px] left-[-100px] h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />

            <div className="relative z-10 flex h-full min-h-[620px] flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[.24em] text-[#f5d36a]">
                  <Coffee size={15} />
                  Ambo Menafesha
                </div>

                <h1 className="mt-8 max-w-xl text-5xl font-black tracking-tight">
                  ጎጆዎን ይምረጡ፣ የቀኑን የይለፍ ቃል ያስገቡ
                </h1>

                <p className="mt-5 max-w-md text-base font-medium leading-7 text-white/70">
                  ትዕዛዝ ለመስጠት ያሉበትን ጎጆ ይምረጡ።
                  ከሰራተኛው የተሰጠዎትን የቀኑን 6 አሃዝ
                  የይለፍ ቃል በማስገባት ወደ ምናሌው ይግቡ።
                </p>
              </div>

              <div className="grid gap-3">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <MapPin
                    className="text-[#f5d36a]"
                    size={24}
                  />
                  <p className="mt-3 font-black">
                    ትክክለኛውን ጎጆ ይምረጡ
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white/55">
                    ትዕዛዝዎ በትክክለኛው ጎጆ ላይ እንዲታይ
                    ያሉበትን ቦታ ይምረጡ።
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <ShieldCheck
                    className="text-[#f5d36a]"
                    size={24}
                  />
                  <p className="mt-3 font-black">
                    የቀኑ የይለፍ ቃል
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white/55">
                    የይለፍ ቃሉ በየቀኑ ይቀየራል እና
                    ከሰራተኛው ይሰጣል።
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#ecfff4] px-4 py-2 text-xs font-black uppercase tracking-[.2em] text-[#087443]">
                <LockKeyhole size={15} />
                የደንበኛ መግቢያ
              </div>

              <h2 className="mt-5 text-4xl font-black tracking-tight text-[#052e1a]">
                ትዕዛዝ ለመጀመር
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-[#064e2b]/65">
                ጎጆዎን ይምረጡ እና የቀኑን የይለፍ ቃል
                ያስገቡ።
              </p>
            </div>

            {connectionState !==
              "online" && (
              <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <AlertCircle
                    size={20}
                    className="mt-0.5 shrink-0 text-amber-700"
                  />

                  <div>
                    <p className="font-black text-amber-900">
                      {connectionState ===
                      "offline"
                        ? "የኢንተርኔት ግንኙነት የለም"
                        : connectionState ===
                            "retrying"
                          ? "በመገናኘት ላይ..."
                          : "ግንኙነቱ ዘግይቷል"}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-amber-800/75">
                      {gojos.length
                        ? "የመጨረሻው የጎጆ ዝርዝር እየታየ ነው።"
                        : "ጎጆዎቹን ለመጫን እንደገና ይሞክሩ።"}
                    </p>

                    {lastUpdatedAt && (
                      <p className="mt-1 text-xs font-bold text-amber-800/55">
                        መጨረሻ የታደሰው፡{" "}
                        {lastUpdatedAt.toLocaleTimeString(
                          [],
                          {
                            hour:
                              "2-digit",
                            minute:
                              "2-digit",
                          },
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void loadGojos(false)
                  }
                  disabled={loadingGojos}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-900 px-4 py-2.5 text-sm font-black text-white disabled:opacity-60"
                >
                  <RefreshCw
                    size={17}
                    className={
                      loadingGojos
                        ? "animate-spin"
                        : ""
                    }
                  />
                  እንደገና ሞክር
                </button>
              </div>
            )}

            <form
              onSubmit={submit}
              className="space-y-5"
            >
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#064e2b]">
                  <Home size={17} />
                  ጎጆ / ቦታ
                </span>

                <div className="relative">
                  <select
                    value={selectedGojoId}
                    onChange={(event) => {
                      setSelectedGojoId(
                        event.target.value,
                      );
                      setError("");
                    }}
                    disabled={
                      loadingGojos ||
                      verifying ||
                      gojos.length === 0
                    }
                    className="w-full appearance-none rounded-2xl border border-[#064e2b]/15 bg-[#fbfdf8] px-4 py-3.5 pr-12 font-bold text-[#052e1a] outline-none transition focus:border-[#087443] focus:ring-4 focus:ring-green-900/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loadingGojos ? (
                      <option>
                        ጎጆዎችን በመጫን ላይ...
                      </option>
                    ) : gojos.length === 0 ? (
                      <option>
                        ምንም ጎጆ አልተገኘም
                      </option>
                    ) : (
                      gojos.map((gojo) => (
                        <option
                          key={gojo.id}
                          value={gojo.id}
                        >
                          {getGojoLabel(gojo)}
                        </option>
                      ))
                    )}
                  </select>

                  {loadingGojos && (
                    <Loader2
                      size={18}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#087443]"
                    />
                  )}
                </div>
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#064e2b]">
                  <KeyRound size={17} />
                  የቀኑ የይለፍ ቃል
                </span>

                <input
                  type="text"
                  value={code}
                  onChange={(event) =>
                    handleCodeChange(
                      event.target.value,
                    )
                  }
                  disabled={
                    verifying ||
                    loadingGojos ||
                    !selectedGojoId
                  }
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  className="w-full rounded-2xl border border-[#064e2b]/15 bg-[#fbfdf8] px-4 py-4 text-center text-2xl font-black tracking-[.4em] text-[#052e1a] outline-none transition placeholder:text-[#064e2b]/20 focus:border-[#087443] focus:ring-4 focus:ring-green-900/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>

              <button
                type="button"
                onClick={openScanner}
                disabled={
                  scannerLoading ||
                  verifying ||
                  loadingGojos
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#087443]/20 bg-[#ecfff4] px-5 py-3.5 font-black text-[#087443] transition hover:border-[#087443]/35 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {scannerLoading ? (
                  <>
                    <Loader2
                      size={19}
                      className="animate-spin"
                    />
                    ካሜራውን በመክፈት ላይ...
                  </>
                ) : (
                  <>
                    <ScanLine size={20} />
                    የሰራተኛውን QR ኮድ ስካን ያድርጉ
                  </>
                )}
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-[#064e2b]/10" />
                <span className="text-xs font-black uppercase tracking-[.18em] text-[#064e2b]/40">
                  ወይም
                </span>
                <div className="h-px flex-1 bg-[#064e2b]/10" />
              </div>

              {selectedGojo && (
                <div className="flex items-center gap-3 rounded-2xl border border-[#087443]/15 bg-[#ecfff4] px-4 py-3">
                  <MapPin
                    size={20}
                    className="shrink-0 text-[#087443]"
                  />
                  <div>
                    <p className="text-xs font-black uppercase tracking-[.16em] text-[#087443]">
                      የተመረጠ ጎጆ
                    </p>
                    <p className="font-black text-[#052e1a]">
                      {getGojoLabel(selectedGojo)}
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
                >
                  <AlertCircle
                    size={20}
                    className="mt-0.5 shrink-0"
                  />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  <CheckCircle2
                    size={20}
                    className="mt-0.5 shrink-0"
                  />
                  <span>
                    ተረጋግጧል። ወደ ምናሌው በመግባት ላይ...
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  verifying ||
                  loadingGojos ||
                  !selectedGojoId ||
                  code.length !== 6 ||
                  connectionState === "offline"
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#052e1a] px-5 py-4 font-black text-white shadow-lg shadow-[#052e1a]/15 transition hover:-translate-y-0.5 hover:bg-[#064e2b] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {verifying ? (
                  <>
                    <Loader2
                      size={19}
                      className="animate-spin"
                    />
                    በማረጋገጥ ላይ...
                  </>
                ) : (
                  <>
                    ወደ ምናሌው ይግቡ
                    <ArrowRight size={19} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => void loadGojos(false)}
                disabled={
                  loadingGojos ||
                  verifying
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#064e2b]/12 bg-white px-5 py-3.5 font-black text-[#064e2b] transition hover:bg-[#f7fbf2] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={18}
                  className={
                    loadingGojos
                      ? "animate-spin"
                      : ""
                  }
                />
                ጎጆዎቹን እንደገና ጫን
              </button>
            </form>

            <div className="mt-6 rounded-[1.5rem] border border-[#064e2b]/10 bg-[#f7fbf2] p-4">
              <p className="text-sm font-bold leading-6 text-[#064e2b]/70">
                የቀኑን የይለፍ ቃል ካላወቁ እባክዎ
                ሰራተኛውን ይጠይቁ።
              </p>
            </div>
          </div>
        </div>
      </section>

      {scannerOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#02170d]/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              stopScanner();
            }
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 bg-[#052e1a] p-5 text-white">
              <div>
                <p className="text-xs font-black uppercase tracking-[.18em] text-[#f5d36a]">
                  QR Scanner
                </p>

                <h2 className="mt-1 flex items-center gap-2 text-xl font-black">
                  <QrCode size={22} />
                  QR ኮዱን ወደ ካሜራው ያሳዩ
                </h2>
              </div>

              <button
                type="button"
                onClick={stopScanner}
                className="rounded-xl bg-white/10 p-2.5 transition hover:bg-white/20"
                aria-label="Close QR scanner"
              >
                <X size={21} />
              </button>
            </div>

            <div className="p-5">
              <div className="overflow-hidden rounded-[1.5rem] border border-[#064e2b]/10 bg-black">
                <div
                  id="gojo-qr-reader"
                  className="min-h-[300px] w-full"
                />
              </div>

              <p className="mt-4 text-center text-sm font-semibold leading-6 text-[#064e2b]/65">
                በሰራተኛው ገጽ የተፈጠረውን QR ኮድ
                በሳጥኑ ውስጥ ያስገቡ። ጎጆውና የቀኑ
                የይለፍ ቃል በራሳቸው ይሞላሉ።
              </p>

              <button
                type="button"
                onClick={stopScanner}
                className="mt-4 w-full rounded-2xl border border-red-200 bg-red-50 px-5 py-3 font-black text-red-700 transition hover:bg-red-100"
              >
                ስካኑን ዝጋ
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
