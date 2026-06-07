



// "use client";

// import { useEffect, useMemo, useRef, useState } from "react";
// import { TopNav } from "@/components/TopNav";
// import {
//   AlertCircle,
//   BellRing,
//   CheckCircle2,
//   CircleDollarSign,
//   Clock3,
//   Coffee,
//   Home,
//   Loader2,
//   ReceiptText,
//   RotateCw,
//   Save,
//   Users,
//   XCircle,
// } from "lucide-react";

// type Order = {
//   id: string;
//   quantity: number;
//   customerText?: string;
//   status: string;
//   totalPrice: string;
//   createdAt: string;
//   gojo: {
//     id: string;
//     name: string;
//     number: number;
//   };
//   product: {
//     name: string;
//     category: string;
//   };
// };

// type Summary = {
//   byGojo: any[];
//   productTotals: any[];
//   totals: any;
// };

// type Notice = {
//   type: "success" | "error" | "info";
//   text: string;
// };

// const STATUS_FLOW = ["RECEIVED", "PREPARING", "DELIVERED", "CANCELLED"];
// type OrderTab = "LIVE" | "COMPLETED" | "CANCELLED";

// const statusConfig: Record<
//   string,
//   {
//     label: string;
//     className: string;
//     icon: any;
//   }
// > = {
//   NEW: {
//     label: "አዲስ",
//     icon: BellRing,
//     className: "bg-amber-50 text-amber-700 border-amber-200",
//   },
//   RECEIVED: {
//     label: "ተቀብሏል",
//     icon: CheckCircle2,
//     className: "bg-blue-50 text-blue-700 border-blue-200",
//   },
//   PREPARING: {
//     label: "በዝግጅት ላይ",
//     icon: Coffee,
//     className: "bg-purple-50 text-purple-700 border-purple-200",
//   },
//   DELIVERED: {
//     label: "ተጠናቋል",
//     icon: CheckCircle2,
//     className: "bg-emerald-50 text-emerald-700 border-emerald-200",
//   },
//   CANCELLED: {
//     label: "ተሰርዟል",
//     icon: XCircle,
//     className: "bg-red-50 text-red-700 border-red-200",
//   },
// };

// async function readJsonSafe(url: string, signal?: AbortSignal) {
//   const res = await fetch(url, {
//     cache: "no-store",
//     signal,
//     headers: {
//       Accept: "application/json",
//     },
//   });

//   const text = await res.text();

//   if (!res.ok) {
//     throw new Error(text || `${url} failed with status ${res.status}`);
//   }

//   if (!text.trim()) {
//     return {};
//   }

//   try {
//     return JSON.parse(text);
//   } catch {
//     throw new Error(`${url} returned invalid JSON.`);
//   }
// }

// function formatMoney(value: any) {
//   return `${Number(value || 0).toFixed(0)} ብር`;
// }

// function formatTime(value: string) {
//   try {
//     return new Date(value).toLocaleTimeString([], {
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   } catch {
//     return "";
//   }
// }

// function getStatusConfig(status: string) {
//   return statusConfig[status] || statusConfig.NEW;
// }

// export default function StaffPage() {
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [summary, setSummary] = useState<Summary | null>(null);

//   const [selectedGojoId, setSelectedGojoId] = useState("");
//   const [peopleCount, setPeopleCount] = useState("");
//   const [seatPrice, setSeatPrice] = useState("");
//   const [orderTab, setOrderTab] = useState<OrderTab>("LIVE");

//   const [soundOn, setSoundOn] = useState(true);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [savingGojo, setSavingGojo] = useState(false);
//   const [updatingOrderId, setUpdatingOrderId] = useState("");
//   const [notice, setNotice] = useState<Notice | null>(null);

//   const lastOrderId = useRef<string | null>(null);
//   const loadingRef = useRef(false);
//   const mountedRef = useRef(false);
//   const requestControllerRef = useRef<AbortController | null>(null);
//   const gojoInputsDirtyRef = useRef(false);

//   function beep() {
//     try {
//       const AudioContextClass =
//         window.AudioContext || (window as any).webkitAudioContext;

//       const ctx = new AudioContextClass();
//       const osc = ctx.createOscillator();
//       const gain = ctx.createGain();

//       osc.frequency.value = 880;
//       gain.gain.value = 0.08;

//       osc.connect(gain);
//       gain.connect(ctx.destination);
//       osc.start();

//       setTimeout(() => {
//         osc.stop();
//         ctx.close();
//       }, 280);
//     } catch (err) {
//       console.warn("Sound could not play:", err);
//     }
//   }

//   async function load(play = false, manual = false) {
//     if (loadingRef.current) return false;

//     loadingRef.current = true;
//     const controller = new AbortController();
//     requestControllerRef.current = controller;

//     try {
//       if (manual && mountedRef.current) setRefreshing(true);

//       const [ordersResult, summaryResult] = await Promise.allSettled([
//         readJsonSafe("/api/orders", controller.signal),
//         readJsonSafe("/api/summary", controller.signal),
//       ]);

//       if (!mountedRef.current || controller.signal.aborted) return false;

//       let receivedData = false;
//       const errors: string[] = [];

//       if (ordersResult.status === "fulfilled") {
//         const ordersData = ordersResult.value;
//         const newOrders: Order[] = Array.isArray(ordersData.orders)
//           ? ordersData.orders
//           : [];

//         if (
//           play &&
//           soundOn &&
//           lastOrderId.current &&
//           newOrders[0]?.id &&
//           newOrders[0].id !== lastOrderId.current
//         ) {
//           beep();
//         }

//         lastOrderId.current = newOrders[0]?.id || lastOrderId.current;
//         setOrders(newOrders);
//         receivedData = true;
//       } else if (ordersResult.reason?.name !== "AbortError") {
//         errors.push(
//           ordersResult.reason?.message || "ትዕዛዞችን መጫን አልተቻለም።"
//         );
//       }

//       if (summaryResult.status === "fulfilled") {
//         const summaryData = summaryResult.value;
//         const nextSummary = {
//           byGojo: Array.isArray(summaryData.byGojo) ? summaryData.byGojo : [],
//           productTotals: Array.isArray(summaryData.productTotals)
//             ? summaryData.productTotals
//             : [],
//           totals: summaryData.totals || {},
//         };

//         setSummary(nextSummary);

//         if (!selectedGojoId && nextSummary.byGojo?.[0]?.gojo?.id) {
//           const firstGojo = nextSummary.byGojo[0];
//           setSelectedGojoId(firstGojo.gojo.id);

//           if (!gojoInputsDirtyRef.current) {
//             setPeopleCount(String(firstGojo.peopleCount ?? ""));
//             setSeatPrice(String(firstGojo.seatPrice ?? ""));
//           }
//         }

//         receivedData = true;
//       } else if (summaryResult.reason?.name !== "AbortError") {
//         errors.push(
//           summaryResult.reason?.message || "ማጠቃለያውን መጫን አልተቻለም።"
//         );
//       }

//       if (errors.length > 0 && !receivedData) {
//         throw new Error(errors.join(" "));
//       }

//       // A temporary failure in one endpoint should not erase good data from
//       // the other endpoint or flood the staff screen with repeating errors.
//       if (errors.length > 0 && manual) {
//         setNotice({
//           type: "info",
//           text: "አንዳንድ መረጃዎች አልታደሱም። ያለው መረጃ እንዳለ ተጠብቋል።",
//         });
//       } else if (manual) {
//         setNotice({
//           type: "success",
//           text: "መረጃው ታድሷል።",
//         });
//       }

//       return receivedData;
//     } catch (err: any) {
//       if (err?.name === "AbortError" || !mountedRef.current) return false;

//       console.error("Failed to load staff data:", err);

//       // Only show automatic polling errors on the first load. A momentary
//       // network/database slowdown should keep the existing screen usable.
//       if (manual || loading) {
//         setNotice({
//           type: "error",
//           text: err?.message || "የሰራተኞችን መረጃ መጫን አልተቻለም።",
//         });
//       }

//       return false;
//     } finally {
//       if (requestControllerRef.current === controller) {
//         requestControllerRef.current = null;
//       }

//       if (mountedRef.current) {
//         setLoading(false);
//         setRefreshing(false);
//       }

//       loadingRef.current = false;
//     }
//   }

//   useEffect(() => {
//     mountedRef.current = true;
//     let timer: ReturnType<typeof setTimeout> | null = null;
//     let stopped = false;

//     async function poll() {
//       await load(true);

//       if (!stopped && mountedRef.current) {
//         timer = setTimeout(poll, 4000);
//       }
//     }

//     load(false).finally(() => {
//       if (!stopped && mountedRef.current) {
//         timer = setTimeout(poll, 4000);
//       }
//     });

//     return () => {
//       stopped = true;
//       mountedRef.current = false;

//       if (timer) clearTimeout(timer);
//       requestControllerRef.current?.abort();
//       requestControllerRef.current = null;
//       loadingRef.current = false;
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [soundOn]);

//   useEffect(() => {
//     const selected = summary?.byGojo?.find(
//       (row) => row.gojo.id === selectedGojoId
//     );

//     if (selected && !gojoInputsDirtyRef.current) {
//       setPeopleCount(String(selected.peopleCount ?? ""));
//       setSeatPrice(String(selected.seatPrice ?? ""));
//     }
//   }, [selectedGojoId, summary]);

//   async function setStatus(id: string, status: string) {
//     try {
//       setUpdatingOrderId(`${id}-${status}`);
//       setNotice(null);

//       const res = await fetch(`/api/orders/${id}`, {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ status }),
//       });

//       const text = await res.text();

//       if (!res.ok) {
//         throw new Error(text || "ትዕዛዙን ማዘመን አልተቻለም።");
//       }

//       setNotice({
//         type: "success",
//         text: `ትዕዛዙ ${getStatusConfig(status).label} ተብሎ ተዘምኗል።`,
//       });

//       await load(false);
//     } catch (err: any) {
//       console.error("Failed to update order:", err);

//       setNotice({
//         type: "error",
//         text: err?.message || "ትዕዛዙን ማዘመን አልተቻለም።",
//       });
//     } finally {
//       setUpdatingOrderId("");
//     }
//   }

//   async function saveGojo() {
//     if (!selectedGojoId) {
//       setNotice({
//         type: "error",
//         text: "እባክዎ መጀመሪያ ጎጆ ይምረጡ።",
//       });
//       return;
//     }

//     try {
//       setSavingGojo(true);
//       setNotice(null);

//       const res = await fetch("/api/day-gojos", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           gojoId: selectedGojoId,
//           peopleCount: Math.max(Number(peopleCount || 0), 0),
//           seatPrice: Math.max(Number(seatPrice || 0), 0),
//         }),
//       });

//       const text = await res.text();

//       if (!res.ok) {
//         throw new Error(text || "የጎጆውን ክፍያ ማስቀመጥ አልተቻለም።");
//       }

//       setNotice({
//         type: "success",
//         text: "የጎጆው ክፍያ በትክክል ተቀምጧል።",
//       });

//       gojoInputsDirtyRef.current = false;
//       await load(false);
//     } catch (err: any) {
//       console.error("Failed to save gojo billing:", err);

//       setNotice({
//         type: "error",
//         text: err?.message || "የጎጆውን ክፍያ ማስቀመጥ አልተቻለም።",
//       });
//     } finally {
//       setSavingGojo(false);
//     }
//   }

//   const pendingCount = orders.filter((order) => order.status === "NEW").length;
//   const activeCount = orders.filter((order) =>
//     ["NEW", "RECEIVED", "PREPARING"].includes(order.status)
//   ).length;
//   const deliveredCount = orders.filter(
//     (order) => order.status === "DELIVERED"
//   ).length;

//   const selectedGojo = useMemo(() => {
//     return summary?.byGojo?.find((row) => row.gojo.id === selectedGojoId);
//   }, [summary, selectedGojoId]);

//   const activeOrders = useMemo(() => {
//     return orders.filter((order) =>
//       ["NEW", "RECEIVED", "PREPARING"].includes(order.status)
//     );
//   }, [orders]);

//   const deliveredOrders = useMemo(() => {
//     return orders.filter((order) => order.status === "DELIVERED");
//   }, [orders]);

//   const cancelledOrders = useMemo(() => {
//     return orders.filter((order) => order.status === "CANCELLED");
//   }, [orders]);

//   const visibleOrders = useMemo(() => {
//     if (orderTab === "COMPLETED") return deliveredOrders;
//     if (orderTab === "CANCELLED") return cancelledOrders;
//     return activeOrders;
//   }, [orderTab, activeOrders, deliveredOrders, cancelledOrders]);

//   return (
//     <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(215,169,52,0.14),transparent_34%),linear-gradient(135deg,#f5f7ef,#e8f5ec_45%,#f7f3df)] pb-10">
//       {/* <TopNav
//   title="የሰራተኞች ገጽ"
//   role="staff"
// /> */}

//       <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
//         <div className="mb-6 overflow-hidden rounded-[2rem] bg-[#052e1a] shadow-2xl sm:rounded-[2.75rem]">
//           <div className="relative p-6 text-white sm:p-8 lg:p-10">
//             <div className="absolute right-[-80px] top-[-90px] h-64 w-64 rounded-full bg-[#d7a934]/20 blur-3xl" />
//             <div className="absolute bottom-[-100px] left-[-80px] h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

//             <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
//               <div>
//                 <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[.22em] text-[#f5d36a]">
//                   <BellRing size={15} />
//                   የቀጥታ የሰራተኞች ስራ
//                 </div>

//                 <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
//                   የዛሬ ትዕዛዞች
//                 </h1>

//                 <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/70 sm:text-base">
//                   ትዕዛዞችን ይቀበሉ፣ የዝግጅት ሁኔታን ያዘምኑ፣ የጎጆ ሰው ብዛትና የመቀመጫ ዋጋ ያስተዳድሩ።
//                 </p>
//               </div>

//               <div className="grid grid-cols-3 gap-3 sm:min-w-[480px]">
//                 <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
//                   <p className="text-xs font-bold text-white/55">አዲስ</p>
//                   <p className="mt-1 text-3xl font-black text-[#f5d36a]">
//                     {pendingCount}
//                   </p>
//                 </div>

//                 <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
//                   <p className="text-xs font-bold text-white/55">ቀጥታ</p>
//                   <p className="mt-1 text-3xl font-black">{activeCount}</p>
//                 </div>

//                 <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
//                   <p className="text-xs font-bold text-white/55">የተጠናቀቀ</p>
//                   <p className="mt-1 text-3xl font-black">{deliveredCount}</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {notice && (
//           <div
//             className={`mb-5 flex items-start gap-3 rounded-[1.5rem] border px-5 py-4 text-sm font-bold shadow-sm ${
//               notice.type === "success"
//                 ? "border-emerald-200 bg-emerald-50 text-emerald-800"
//                 : notice.type === "error"
//                   ? "border-red-200 bg-red-50 text-red-700"
//                   : "border-amber-200 bg-amber-50 text-amber-800"
//             }`}
//           >
//             {notice.type === "success" ? (
//               <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
//             ) : (
//               <AlertCircle size={20} className="mt-0.5 shrink-0" />
//             )}
//             <span>{notice.text}</span>
//           </div>
//         )}

//         <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
//           <div className="space-y-5">
//             <div className="soft-card flex flex-col gap-4 rounded-[2rem] p-5 sm:flex-row sm:items-center sm:justify-between">
//               <div>
//                 <p className="text-xs font-black uppercase tracking-[.24em] text-[#087443]">
//                   የትዕዛዝ ወረፋ
//                 </p>

//                 <h2 className="mt-1 text-2xl font-black text-[#052e1a]">
//                   {activeCount} የቀጥታ ትዕዛዝ
//                 </h2>

//                 <p className="mt-1 text-sm font-semibold text-[#064e2b]/60">
//                   በየ4 ሰከንዱ በራሱ ይታደሳል።
//                 </p>
//               </div>

//               <div className="flex flex-wrap gap-2">
//                 <button
//                   type="button"
//                   onClick={() => setSoundOn((value) => !value)}
//                   className={`rounded-2xl px-4 py-3 font-black transition ${
//                     soundOn
//                       ? "bg-[#ecfff4] text-[#087443]"
//                       : "bg-white text-[#064e2b]"
//                   }`}
//                 >
//                   <BellRing size={18} className="mr-2 inline" />
//                   ድምፅ {soundOn ? "በርቷል" : "ጠፍቷል"}
//                 </button>

//                 <button
//                   type="button"
//                   onClick={() => load(false, true)}
//                   disabled={refreshing}
//                   className="btn-primary rounded-2xl px-4 py-3 font-black disabled:opacity-60"
//                 >
//                   {refreshing ? (
//                     <>
//                       <Loader2 size={18} className="mr-2 inline animate-spin" />
//                       በመታደስ ላይ
//                     </>
//                   ) : (
//                     <>
//                       <RotateCw size={18} className="mr-2 inline" />
//                       አድስ
//                     </>
//                   )}
//                 </button>
//               </div>
//             </div>

//             <div className="soft-card grid grid-cols-3 gap-2 rounded-[1.5rem] p-2">
//               {[
//                 { id: "LIVE" as OrderTab, label: "ቀጥታ", count: activeOrders.length },
//                 { id: "COMPLETED" as OrderTab, label: "የተጠናቀቁ", count: deliveredOrders.length },
//                 { id: "CANCELLED" as OrderTab, label: "የተሰረዙ", count: cancelledOrders.length },
//               ].map((tab) => (
//                 <button
//                   key={tab.id}
//                   type="button"
//                   onClick={() => setOrderTab(tab.id)}
//                   className={`rounded-2xl px-3 py-3 text-sm font-black transition ${
//                     orderTab === tab.id
//                       ? "bg-[#052e1a] text-white shadow-lg"
//                       : "bg-white/70 text-[#064e2b] hover:bg-white"
//                   }`}
//                 >
//                   {tab.label}
//                   <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
//                     orderTab === tab.id
//                       ? "bg-white/15 text-[#f5d36a]"
//                       : "bg-[#ecfff4] text-[#087443]"
//                   }`}>
//                     {tab.count}
//                   </span>
//                 </button>
//               ))}
//             </div>

//             {loading && (
//               <div className="space-y-4">
//                 {[1, 2, 3].map((item) => (
//                   <div
//                     key={item}
//                     className="soft-card animate-pulse rounded-[2rem] p-5"
//                   >
//                     <div className="h-4 w-32 rounded-full bg-[#064e2b]/10" />
//                     <div className="mt-4 h-8 w-64 rounded-full bg-[#064e2b]/10" />
//                     <div className="mt-3 h-4 w-44 rounded-full bg-[#064e2b]/10" />
//                     <div className="mt-5 flex gap-2">
//                       <div className="h-10 w-24 rounded-xl bg-[#064e2b]/10" />
//                       <div className="h-10 w-24 rounded-xl bg-[#064e2b]/10" />
//                       <div className="h-10 w-24 rounded-xl bg-[#064e2b]/10" />
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}

//             {!loading && visibleOrders.length === 0 && (
//               <div className="soft-card rounded-[2rem] p-10 text-center">
//                 <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-[#ecfff4] text-[#087443]">
//                   <CheckCircle2 size={32} />
//                 </div>

//                 <p className="mt-5 text-xl font-black text-[#052e1a]">
//                   {orderTab === "LIVE"
//                     ? "የቀጥታ ትዕዛዝ የለም"
//                     : orderTab === "COMPLETED"
//                       ? "የተጠናቀቀ ትዕዛዝ የለም"
//                       : "የተሰረዘ ትዕዛዝ የለም"}
//                 </p>

//                 <p className="mt-2 text-sm font-semibold text-[#064e2b]/60">
//                   {orderTab === "LIVE"
//                     ? "አዲስ የደንበኛ ትዕዛዞች እዚህ በራሳቸው ይታያሉ።"
//                     : "በዚህ ምድብ ውስጥ እስካሁን ትዕዛዝ የለም።"}
//                 </p>
//               </div>
//             )}

//             {!loading &&
//               visibleOrders.map((order) => {
//                 const config = getStatusConfig(order.status);
//                 const StatusIcon = config.icon;

//                 return (
//                   <article
//                     key={order.id}
//                     className="soft-card overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 p-0 shadow-sm"
//                   >
//                     <div className="border-b border-[#064e2b]/10 bg-white/70 px-5 py-4">
//                       <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//                         <div className="flex items-center gap-3">
//                           <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ecfff4] text-[#087443]">
//                             <Home size={22} />
//                           </div>

//                           <div>
//                             <p className="text-xs font-black uppercase tracking-[.18em] text-[#087443]">
//                               {order.gojo.name}
//                             </p>

//                             <p className="text-sm font-bold text-[#064e2b]/60">
//                               የታዘዘበት ሰዓት {formatTime(order.createdAt)}
//                             </p>
//                           </div>
//                         </div>

//                         <span
//                           className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${config.className}`}
//                         >
//                           <StatusIcon size={14} />
//                           {config.label}
//                         </span>
//                       </div>
//                     </div>

//                     <div className="p-5">
//                       <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
//                         <div>
//                           <h3 className="text-2xl font-black text-[#052e1a]">
//                             {order.quantity} × {order.product.name}
//                           </h3>

//                           <p className="mt-1 text-sm font-semibold text-[#064e2b]/65">
//                             {order.product.category} ·{" "}
//                             {formatMoney(order.totalPrice)}
//                           </p>

//                           {order.customerText && (
//                             <div className="mt-4 rounded-[1.25rem] border border-[#064e2b]/10 bg-[#f7fbf2] px-4 py-3">
//                               <p className="text-xs font-black uppercase tracking-[.16em] text-[#087443]">
//                                 የደንበኛ ማስታወሻ
//                               </p>
//                               <p className="mt-1 text-sm font-bold leading-6 text-[#102018]">
//                                 {order.customerText}
//                               </p>
//                             </div>
//                           )}
//                         </div>

//                         <div className="rounded-[1.25rem] bg-[#052e1a] px-4 py-3 text-right text-white sm:min-w-[130px]">
//                           <p className="text-xs font-bold text-white/55">
//                             Total
//                           </p>
//                           <p className="text-xl font-black">
//                             {formatMoney(order.totalPrice)}
//                           </p>
//                         </div>
//                       </div>

//                       {orderTab === "LIVE" && (
//                         <div className="mt-5 grid gap-2 sm:grid-cols-4">
//                           {STATUS_FLOW.map((status) => {
//                           const isUpdating =
//                             updatingOrderId === `${order.id}-${status}`;

//                           return (
//                             <button
//                               key={status}
//                               type="button"
//                               onClick={() => setStatus(order.id, status)}
//                               disabled={Boolean(updatingOrderId)}
//                               className={`rounded-2xl border px-3 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
//                                 status === "CANCELLED"
//                                   ? "border-red-100 bg-red-50 text-red-700 hover:bg-red-100"
//                                   : "border-[#064e2b]/10 bg-white text-[#064e2b] hover:border-[#087443]/30 hover:bg-[#ecfff4]"
//                               }`}
//                             >
//                               {isUpdating ? (
//                                 <>
//                                   <Loader2
//                                     size={16}
//                                     className="mr-2 inline animate-spin"
//                                   />
//                                   በማስቀመጥ ላይ
//                                 </>
//                               ) : (
//                                 getStatusConfig(status).label
//                               )}
//                             </button>
//                           );
//                           })}
//                         </div>
//                       )}
//                     </div>
//                   </article>
//                 );
//               })}

//                       </div>

//           <aside className="space-y-5">
//             <div className="soft-card rounded-[2rem] p-5">
//               <div className="flex items-start justify-between gap-4">
//                 <div>
//                   <p className="text-xs font-black uppercase tracking-[.2em] text-[#087443]">
//                     የጎጆ ክፍያ
//                   </p>
//                   <h2 className="mt-2 flex items-center gap-2 text-xl font-black text-[#052e1a]">
//                     <Users size={22} />
//                     የሰው ብዛትና የመቀመጫ ዋጋ
//                   </h2>
//                 </div>

//                 <div className="rounded-2xl bg-[#064e2b]/8 p-3 text-[#064e2b]">
//                   <ReceiptText size={22} />
//                 </div>
//               </div>

//               <select
//                 value={selectedGojoId}
//                 onChange={(event) => {
//                   gojoInputsDirtyRef.current = false;
//                   setSelectedGojoId(event.target.value);
//                 }}
//                 className="mt-5 w-full rounded-2xl border border-[#064e2b]/15 bg-white px-4 py-3 font-bold text-[#052e1a] outline-none focus:border-[#087443] focus:ring-4 focus:ring-green-900/10"
//               >
//                 <option value="">ጎጆ ይምረጡ</option>

//                 {summary?.byGojo?.map((row) => (
//                   <option key={row.gojo.id} value={row.gojo.id}>
//                     {row.gojo.name}
//                   </option>
//                 ))}
//               </select>

//               <div className="mt-4 grid grid-cols-2 gap-3">
//                 <label>
//                   <span className="mb-2 block text-xs font-black uppercase tracking-[.16em] text-[#087443]">
//                     ሰዎች
//                   </span>
//                   <input
//                     type="number"
//                     min={0}
//                     placeholder="ሰዎች"
//                     value={peopleCount}
//                     onChange={(event) =>
//                       setPeopleCount(Number(event.target.value))
//                     }
//                     className="w-full rounded-2xl border border-[#064e2b]/15 bg-white px-4 py-3 font-bold text-[#052e1a] outline-none focus:border-[#087443] focus:ring-4 focus:ring-green-900/10"
//                   />
//                 </label>

//                 <label>
//                   <span className="mb-2 block text-xs font-black uppercase tracking-[.16em] text-[#087443]">
//                     የመቀመጫ ዋጋ
//                   </span>
//                   <input
//                     type="number"
//                     min={0}
//                     placeholder="የመቀመጫ ዋጋ"
//                     value={seatPrice}
//                     onChange={(event) => {
//                       gojoInputsDirtyRef.current = true;
//                       setSeatPrice(event.target.value);
//                     }}
//                     className="w-full rounded-2xl border border-[#064e2b]/15 bg-white px-4 py-3 font-bold text-[#052e1a] outline-none focus:border-[#087443] focus:ring-4 focus:ring-green-900/10"
//                   />
//                 </label>
//               </div>

//               <button
//                 type="button"
//                 onClick={saveGojo}
//                 disabled={savingGojo || !selectedGojoId}
//                 className="btn-primary mt-4 w-full rounded-2xl px-4 py-3 font-black disabled:cursor-not-allowed disabled:opacity-60"
//               >
//                 {savingGojo ? (
//                   <>
//                     <Loader2 size={18} className="mr-2 inline animate-spin" />
//                     ክፍያው በመቀመጥ ላይ
//                   </>
//                 ) : (
//                   <>
//                     <Save size={18} className="mr-2 inline" />
//                     የጎጆ ክፍያ አስቀምጥ
//                   </>
//                 )}
//               </button>

//               {selectedGojo && (
//                 <div className="mt-4 rounded-[1.5rem] border border-[#064e2b]/10 bg-white p-4">
//                   <p className="text-xs font-black uppercase tracking-[.16em] text-[#087443]">
//                     የአሁኑ ድምር
//                   </p>

//                   <p className="mt-1 text-2xl font-black text-[#052e1a]">
//                     {formatMoney(selectedGojo.grandTotal)}
//                   </p>

//                   <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-bold text-[#064e2b]/70">
//                     <div className="rounded-2xl bg-[#f7fbf2] p-3">
//                       <p className="text-xs text-[#064e2b]/45">ሰዎች</p>
//                       <p>{Number(selectedGojo.peopleCount || 0)}</p>
//                     </div>

//                     <div className="rounded-2xl bg-[#f7fbf2] p-3">
//                       <p className="text-xs text-[#064e2b]/45">የመቀመጫ ዋጋ</p>
//                       <p>{formatMoney(selectedGojo.seatPrice)}</p>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>

//             <div className="soft-card rounded-[2rem] p-5">
//               <div className="flex items-start justify-between gap-4">
//                 <div>
//                   <p className="text-xs font-black uppercase tracking-[.2em] text-[#087443]">
//                     የሽያጭ ማጠቃለያ
//                   </p>

//                   <h2 className="mt-2 flex items-center gap-2 text-xl font-black text-[#052e1a]">
//                     <CircleDollarSign size={22} />
//                     የምርት ድምር
//                   </h2>
//                 </div>

//                 <div className="rounded-2xl bg-[#064e2b]/8 p-3 text-[#064e2b]">
//                   <Clock3 size={22} />
//                 </div>
//               </div>

//               <div className="mt-5 space-y-2">
//                 {summary?.productTotals?.map((product) => (
//                   <div
//                     key={product.name}
//                     className="flex items-center justify-between gap-4 rounded-2xl bg-white p-3 text-sm"
//                   >
//                     <div>
//                       <p className="font-black text-[#052e1a]">
//                         {product.name}
//                       </p>
//                       <p className="text-xs font-bold text-[#064e2b]/55">
//                         ብዛት፡ {product.quantity}
//                       </p>
//                     </div>

//                     <span className="font-black text-[#087443]">
//                       {formatMoney(product.total)}
//                     </span>
//                   </div>
//                 ))}

//                 {!summary?.productTotals?.length && (
//                   <p className="rounded-2xl bg-white p-4 text-sm font-bold text-[#064e2b]/60">
//                     እስካሁን የምርት ድምር የለም።
//                   </p>
//                 )}
//               </div>

//               <div className="mt-4 rounded-[1.5rem] bg-[#052e1a] p-5 text-white">
//                 <p className="text-sm font-bold text-white/60">
//                   የዛሬ አጠቃላይ ድምር
//                 </p>

//                 <p className="mt-1 text-4xl font-black text-[#f5d36a]">
//                   {formatMoney(summary?.totals?.grandTotal)}
//                 </p>
//               </div>
//             </div>
//           </aside>
//         </div>
//       </section>
//     </main>
//   );
// }




"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TopNav } from "@/components/TopNav";
import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Coffee,
  Home,
  Loader2,
  ReceiptText,
  RotateCw,
  Save,
  Users,
  XCircle,
} from "lucide-react";

type Order = {
  id: string;
  quantity: number;
  customerText?: string;
  status: string;
  totalPrice: string;
  createdAt: string;
  gojo: {
    id: string;
    name: string;
    number: number;
  };
  product: {
    name: string;
    category: string;
  };
};

type Summary = {
  byGojo: any[];
  productTotals: any[];
  totals: any;
};

type Notice = {
  type: "success" | "error" | "info";
  text: string;
};

const STATUS_FLOW = ["RECEIVED", "PREPARING", "DELIVERED", "CANCELLED"];
type OrderTab = "LIVE" | "COMPLETED" | "CANCELLED";

const statusConfig: Record<
  string,
  {
    label: string;
    className: string;
    icon: any;
  }
> = {
  NEW: {
    label: "አዲስ",
    icon: BellRing,
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  RECEIVED: {
    label: "ተቀብሏል",
    icon: CheckCircle2,
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  PREPARING: {
    label: "በዝግጅት ላይ",
    icon: Coffee,
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
  DELIVERED: {
    label: "ተጠናቋል",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  CANCELLED: {
    label: "ተሰርዟል",
    icon: XCircle,
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

async function readJsonSafe(url: string, signal?: AbortSignal) {
  const res = await fetch(url, {
    cache: "no-store",
    signal,
    headers: {
      Accept: "application/json",
    },
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
  return `${Number(value || 0).toFixed(0)} ብር`;
}

function formatTime(value: string) {
  try {
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function getStatusConfig(status: string) {
  return statusConfig[status] || statusConfig.NEW;
}

export default function StaffPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  const [selectedGojoId, setSelectedGojoId] = useState("");
  const [peopleCount, setPeopleCount] = useState("");
  const [seatPrice, setSeatPrice] = useState("");
  const [orderTab, setOrderTab] = useState<OrderTab>("LIVE");

  const [soundOn, setSoundOn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingGojo, setSavingGojo] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);

  const lastOrderId = useRef<string | null>(null);
  const loadingRef = useRef(false);
  const mountedRef = useRef(false);
  const requestControllerRef = useRef<AbortController | null>(null);
  const gojoInputsDirtyRef = useRef(false);

  function beep() {
    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;

      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.value = 880;
      gain.gain.value = 0.08;

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 280);
    } catch (err) {
      console.warn("Sound could not play:", err);
    }
  }

  async function load(play = false, manual = false) {
    if (loadingRef.current) return false;

    loadingRef.current = true;
    const controller = new AbortController();
    requestControllerRef.current = controller;

    try {
      if (manual && mountedRef.current) setRefreshing(true);

      const [ordersResult, summaryResult] = await Promise.allSettled([
        readJsonSafe("/api/orders", controller.signal),
        readJsonSafe("/api/summary", controller.signal),
      ]);

      if (!mountedRef.current || controller.signal.aborted) return false;

      let receivedData = false;
      const errors: string[] = [];

      if (ordersResult.status === "fulfilled") {
        const ordersData = ordersResult.value;
        const newOrders: Order[] = Array.isArray(ordersData.orders)
          ? ordersData.orders
          : [];

        if (
          play &&
          soundOn &&
          lastOrderId.current &&
          newOrders[0]?.id &&
          newOrders[0].id !== lastOrderId.current
        ) {
          beep();
        }

        lastOrderId.current = newOrders[0]?.id || lastOrderId.current;
        setOrders(newOrders);
        receivedData = true;
      } else if (ordersResult.reason?.name !== "AbortError") {
        errors.push(
          ordersResult.reason?.message || "ትዕዛዞችን መጫን አልተቻለም።"
        );
      }

      if (summaryResult.status === "fulfilled") {
        const summaryData = summaryResult.value;
        const nextSummary = {
          byGojo: Array.isArray(summaryData.byGojo) ? summaryData.byGojo : [],
          productTotals: Array.isArray(summaryData.productTotals)
            ? summaryData.productTotals
            : [],
          totals: summaryData.totals || {},
        };

        setSummary(nextSummary);

        if (!selectedGojoId && nextSummary.byGojo?.[0]?.gojo?.id) {
          const firstGojo = nextSummary.byGojo[0];
          setSelectedGojoId(firstGojo.gojo.id);

          if (!gojoInputsDirtyRef.current) {
            setPeopleCount(String(firstGojo.peopleCount ?? ""));
            setSeatPrice(String(firstGojo.seatPrice ?? ""));
          }
        }

        receivedData = true;
      } else if (summaryResult.reason?.name !== "AbortError") {
        errors.push(
          summaryResult.reason?.message || "ማጠቃለያውን መጫን አልተቻለም።"
        );
      }

      if (errors.length > 0 && !receivedData) {
        throw new Error(errors.join(" "));
      }

      // A temporary failure in one endpoint should not erase good data from
      // the other endpoint or flood the staff screen with repeating errors.
      if (errors.length > 0 && manual) {
        setNotice({
          type: "info",
          text: "አንዳንድ መረጃዎች አልታደሱም። ያለው መረጃ እንዳለ ተጠብቋል።",
        });
      } else if (manual) {
        setNotice({
          type: "success",
          text: "መረጃው ታድሷል።",
        });
      }

      return receivedData;
    } catch (err: any) {
      if (err?.name === "AbortError" || !mountedRef.current) return false;

      console.error("Failed to load staff data:", err);

      // Only show automatic polling errors on the first load. A momentary
      // network/database slowdown should keep the existing screen usable.
      if (manual || loading) {
        setNotice({
          type: "error",
          text: err?.message || "የሰራተኞችን መረጃ መጫን አልተቻለም።",
        });
      }

      return false;
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
      }

      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }

      loadingRef.current = false;
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    async function poll() {
      await load(true);

      if (!stopped && mountedRef.current) {
        timer = setTimeout(poll, 4000);
      }
    }

    load(false).finally(() => {
      if (!stopped && mountedRef.current) {
        timer = setTimeout(poll, 4000);
      }
    });

    return () => {
      stopped = true;
      mountedRef.current = false;

      if (timer) clearTimeout(timer);
      requestControllerRef.current?.abort();
      requestControllerRef.current = null;
      loadingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundOn]);

  useEffect(() => {
    const selected = summary?.byGojo?.find(
      (row) => row.gojo.id === selectedGojoId
    );

    if (selected && !gojoInputsDirtyRef.current) {
      setPeopleCount(String(selected.peopleCount ?? ""));
      setSeatPrice(String(selected.seatPrice ?? ""));
    }
  }, [selectedGojoId, summary]);

  async function setStatus(id: string, status: string) {
    try {
      setUpdatingOrderId(`${id}-${status}`);
      setNotice(null);

      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(text || "ትዕዛዙን ማዘመን አልተቻለም።");
      }

      setNotice({
        type: "success",
        text: `ትዕዛዙ ${getStatusConfig(status).label} ተብሎ ተዘምኗል።`,
      });

      await load(false);
    } catch (err: any) {
      console.error("Failed to update order:", err);

      setNotice({
        type: "error",
        text: err?.message || "ትዕዛዙን ማዘመን አልተቻለም።",
      });
    } finally {
      setUpdatingOrderId("");
    }
  }

  async function saveGojo() {
    if (!selectedGojoId) {
      setNotice({
        type: "error",
        text: "እባክዎ መጀመሪያ ጎጆ ይምረጡ።",
      });
      return;
    }

    try {
      setSavingGojo(true);
      setNotice(null);

      const res = await fetch("/api/day-gojos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gojoId: selectedGojoId,
          peopleCount: Math.max(Number(peopleCount || 0), 0),
          seatPrice: Math.max(Number(seatPrice || 0), 0),
        }),
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(text || "የጎጆውን ክፍያ ማስቀመጥ አልተቻለም።");
      }

      setNotice({
        type: "success",
        text: "የጎጆው ክፍያ በትክክል ተቀምጧል።",
      });

      gojoInputsDirtyRef.current = false;
      await load(false);
    } catch (err: any) {
      console.error("Failed to save gojo billing:", err);

      setNotice({
        type: "error",
        text: err?.message || "የጎጆውን ክፍያ ማስቀመጥ አልተቻለም።",
      });
    } finally {
      setSavingGojo(false);
    }
  }

  const pendingCount = orders.filter((order) => order.status === "NEW").length;
  const activeCount = orders.filter((order) =>
    ["NEW", "RECEIVED", "PREPARING"].includes(order.status)
  ).length;
  const deliveredCount = orders.filter(
    (order) => order.status === "DELIVERED"
  ).length;

  const selectedGojo = useMemo(() => {
    return summary?.byGojo?.find((row) => row.gojo.id === selectedGojoId);
  }, [summary, selectedGojoId]);

  const activeOrders = useMemo(() => {
    return orders.filter((order) =>
      ["NEW", "RECEIVED", "PREPARING"].includes(order.status)
    );
  }, [orders]);

  const deliveredOrders = useMemo(() => {
    return orders.filter((order) => order.status === "DELIVERED");
  }, [orders]);

  const cancelledOrders = useMemo(() => {
    return orders.filter((order) => order.status === "CANCELLED");
  }, [orders]);

  const visibleOrders = useMemo(() => {
    if (orderTab === "COMPLETED") return deliveredOrders;
    if (orderTab === "CANCELLED") return cancelledOrders;
    return activeOrders;
  }, [orderTab, activeOrders, deliveredOrders, cancelledOrders]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(215,169,52,0.14),transparent_34%),linear-gradient(135deg,#f5f7ef,#e8f5ec_45%,#f7f3df)] pb-10">
      <TopNav title="የሰራተኞች ገጽ" />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 overflow-hidden rounded-[2rem] bg-[#052e1a] shadow-2xl sm:rounded-[2.75rem]">
          <div className="relative p-6 text-white sm:p-8 lg:p-10">
            <div className="absolute right-[-80px] top-[-90px] h-64 w-64 rounded-full bg-[#d7a934]/20 blur-3xl" />
            <div className="absolute bottom-[-100px] left-[-80px] h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

            <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[.22em] text-[#f5d36a]">
                  <BellRing size={15} />
                  የቀጥታ የሰራተኞች ስራ
                </div>

                <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
                  የዛሬ ትዕዛዞች
                </h1>

                <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/70 sm:text-base">
                  ትዕዛዞችን ይቀበሉ፣ የዝግጅት ሁኔታን ያዘምኑ፣ የጎጆ ሰው ብዛትና የመቀመጫ ዋጋ ያስተዳድሩ።
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:min-w-[480px]">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs font-bold text-white/55">አዲስ</p>
                  <p className="mt-1 text-3xl font-black text-[#f5d36a]">
                    {pendingCount}
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs font-bold text-white/55">ቀጥታ</p>
                  <p className="mt-1 text-3xl font-black">{activeCount}</p>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs font-bold text-white/55">የተጠናቀቀ</p>
                  <p className="mt-1 text-3xl font-black">{deliveredCount}</p>
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

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="space-y-5">
            <div className="soft-card flex flex-col gap-4 rounded-[2rem] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[.24em] text-[#087443]">
                  የትዕዛዝ ወረፋ
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#052e1a]">
                  {activeCount} የቀጥታ ትዕዛዝ
                </h2>

                <p className="mt-1 text-sm font-semibold text-[#064e2b]/60">
                  በየ4 ሰከንዱ በራሱ ይታደሳል።
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSoundOn((value) => !value)}
                  className={`rounded-2xl px-4 py-3 font-black transition ${
                    soundOn
                      ? "bg-[#ecfff4] text-[#087443]"
                      : "bg-white text-[#064e2b]"
                  }`}
                >
                  <BellRing size={18} className="mr-2 inline" />
                  ድምፅ {soundOn ? "በርቷል" : "ጠፍቷል"}
                </button>

                <button
                  type="button"
                  onClick={() => load(false, true)}
                  disabled={refreshing}
                  className="btn-primary rounded-2xl px-4 py-3 font-black disabled:opacity-60"
                >
                  {refreshing ? (
                    <>
                      <Loader2 size={18} className="mr-2 inline animate-spin" />
                      በመታደስ ላይ
                    </>
                  ) : (
                    <>
                      <RotateCw size={18} className="mr-2 inline" />
                      አድስ
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="soft-card grid grid-cols-3 gap-2 rounded-[1.5rem] p-2">
              {[
                { id: "LIVE" as OrderTab, label: "ቀጥታ", count: activeOrders.length },
                { id: "COMPLETED" as OrderTab, label: "የተጠናቀቁ", count: deliveredOrders.length },
                { id: "CANCELLED" as OrderTab, label: "የተሰረዙ", count: cancelledOrders.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setOrderTab(tab.id)}
                  className={`rounded-2xl px-3 py-3 text-sm font-black transition ${
                    orderTab === tab.id
                      ? "bg-[#052e1a] text-white shadow-lg"
                      : "bg-white/70 text-[#064e2b] hover:bg-white"
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                    orderTab === tab.id
                      ? "bg-white/15 text-[#f5d36a]"
                      : "bg-[#ecfff4] text-[#087443]"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="soft-card animate-pulse rounded-[2rem] p-5"
                  >
                    <div className="h-4 w-32 rounded-full bg-[#064e2b]/10" />
                    <div className="mt-4 h-8 w-64 rounded-full bg-[#064e2b]/10" />
                    <div className="mt-3 h-4 w-44 rounded-full bg-[#064e2b]/10" />
                    <div className="mt-5 flex gap-2">
                      <div className="h-10 w-24 rounded-xl bg-[#064e2b]/10" />
                      <div className="h-10 w-24 rounded-xl bg-[#064e2b]/10" />
                      <div className="h-10 w-24 rounded-xl bg-[#064e2b]/10" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && visibleOrders.length === 0 && (
              <div className="soft-card rounded-[2rem] p-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-[#ecfff4] text-[#087443]">
                  <CheckCircle2 size={32} />
                </div>

                <p className="mt-5 text-xl font-black text-[#052e1a]">
                  {orderTab === "LIVE"
                    ? "የቀጥታ ትዕዛዝ የለም"
                    : orderTab === "COMPLETED"
                      ? "የተጠናቀቀ ትዕዛዝ የለም"
                      : "የተሰረዘ ትዕዛዝ የለም"}
                </p>

                <p className="mt-2 text-sm font-semibold text-[#064e2b]/60">
                  {orderTab === "LIVE"
                    ? "አዲስ የደንበኛ ትዕዛዞች እዚህ በራሳቸው ይታያሉ።"
                    : "በዚህ ምድብ ውስጥ እስካሁን ትዕዛዝ የለም።"}
                </p>
              </div>
            )}

            {!loading &&
              visibleOrders.map((order) => {
                const config = getStatusConfig(order.status);
                const StatusIcon = config.icon;

                return (
                  <article
                    key={order.id}
                    className="soft-card overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 p-0 shadow-sm"
                  >
                    <div className="border-b border-[#064e2b]/10 bg-white/70 px-5 py-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ecfff4] text-[#087443]">
                            <Home size={22} />
                          </div>

                          <div>
                            <p className="text-xs font-black uppercase tracking-[.18em] text-[#087443]">
                              {order.gojo.name}
                            </p>

                            <p className="text-sm font-bold text-[#064e2b]/60">
                              የታዘዘበት ሰዓት {formatTime(order.createdAt)}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${config.className}`}
                        >
                          <StatusIcon size={14} />
                          {config.label}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-2xl font-black text-[#052e1a]">
                            {order.quantity} × {order.product.name}
                          </h3>

                          <p className="mt-1 text-sm font-semibold text-[#064e2b]/65">
                            {order.product.category} ·{" "}
                            {formatMoney(order.totalPrice)}
                          </p>

                          {order.customerText && (
                            <div className="mt-4 rounded-[1.25rem] border border-[#064e2b]/10 bg-[#f7fbf2] px-4 py-3">
                              <p className="text-xs font-black uppercase tracking-[.16em] text-[#087443]">
                                የደንበኛ ማስታወሻ
                              </p>
                              <p className="mt-1 text-sm font-bold leading-6 text-[#102018]">
                                {order.customerText}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="rounded-[1.25rem] bg-[#052e1a] px-4 py-3 text-right text-white sm:min-w-[130px]">
                          <p className="text-xs font-bold text-white/55">
                            Total
                          </p>
                          <p className="text-xl font-black">
                            {formatMoney(order.totalPrice)}
                          </p>
                        </div>
                      </div>

                      {orderTab === "LIVE" && (
                        <div className="mt-5 grid gap-2 sm:grid-cols-4">
                          {STATUS_FLOW.map((status) => {
                          const isUpdating =
                            updatingOrderId === `${order.id}-${status}`;

                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() => setStatus(order.id, status)}
                              disabled={Boolean(updatingOrderId)}
                              className={`rounded-2xl border px-3 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                status === "CANCELLED"
                                  ? "border-red-100 bg-red-50 text-red-700 hover:bg-red-100"
                                  : "border-[#064e2b]/10 bg-white text-[#064e2b] hover:border-[#087443]/30 hover:bg-[#ecfff4]"
                              }`}
                            >
                              {isUpdating ? (
                                <>
                                  <Loader2
                                    size={16}
                                    className="mr-2 inline animate-spin"
                                  />
                                  በማስቀመጥ ላይ
                                </>
                              ) : (
                                getStatusConfig(status).label
                              )}
                            </button>
                          );
                          })}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}

                      </div>

          <aside className="space-y-5">
            <div className="soft-card rounded-[2rem] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.2em] text-[#087443]">
                    የጎጆ ክፍያ
                  </p>
                  <h2 className="mt-2 flex items-center gap-2 text-xl font-black text-[#052e1a]">
                    <Users size={22} />
                    የሰው ብዛትና የመቀመጫ ዋጋ
                  </h2>
                </div>

                <div className="rounded-2xl bg-[#064e2b]/8 p-3 text-[#064e2b]">
                  <ReceiptText size={22} />
                </div>
              </div>

              <select
                value={selectedGojoId}
                onChange={(event) => {
                  gojoInputsDirtyRef.current = false;
                  setSelectedGojoId(event.target.value);
                }}
                className="mt-5 w-full rounded-2xl border border-[#064e2b]/15 bg-white px-4 py-3 font-bold text-[#052e1a] outline-none focus:border-[#087443] focus:ring-4 focus:ring-green-900/10"
              >
                <option value="">ጎጆ ይምረጡ</option>

                {summary?.byGojo?.map((row) => (
                  <option key={row.gojo.id} value={row.gojo.id}>
                    {row.gojo.name}
                  </option>
                ))}
              </select>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <label>
                  <span className="mb-2 block text-xs font-black uppercase tracking-[.16em] text-[#087443]">
                    ሰዎች
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    placeholder="ሰዎች"
                    value={peopleCount}
                    onChange={(event) => {
                      gojoInputsDirtyRef.current = true;
                      setPeopleCount(event.target.value);
                    }}
                    className="w-full rounded-2xl border border-[#064e2b]/15 bg-white px-4 py-3 font-bold text-[#052e1a] outline-none focus:border-[#087443] focus:ring-4 focus:ring-green-900/10"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-xs font-black uppercase tracking-[.16em] text-[#087443]">
                    የመቀመጫ ዋጋ
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    placeholder="የመቀመጫ ዋጋ"
                    value={seatPrice}
                    onChange={(event) => {
                      gojoInputsDirtyRef.current = true;
                      setSeatPrice(event.target.value);
                    }}
                    className="w-full rounded-2xl border border-[#064e2b]/15 bg-white px-4 py-3 font-bold text-[#052e1a] outline-none focus:border-[#087443] focus:ring-4 focus:ring-green-900/10"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={saveGojo}
                disabled={savingGojo || !selectedGojoId}
                className="btn-primary mt-4 w-full rounded-2xl px-4 py-3 font-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingGojo ? (
                  <>
                    <Loader2 size={18} className="mr-2 inline animate-spin" />
                    ክፍያው በመቀመጥ ላይ
                  </>
                ) : (
                  <>
                    <Save size={18} className="mr-2 inline" />
                    የጎጆ ክፍያ አስቀምጥ
                  </>
                )}
              </button>

              {selectedGojo && (
                <div className="mt-4 rounded-[1.5rem] border border-[#064e2b]/10 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[.16em] text-[#087443]">
                    የአሁኑ ድምር
                  </p>

                  <p className="mt-1 text-2xl font-black text-[#052e1a]">
                    {formatMoney(selectedGojo.grandTotal)}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-bold text-[#064e2b]/70">
                    <div className="rounded-2xl bg-[#f7fbf2] p-3">
                      <p className="text-xs text-[#064e2b]/45">ሰዎች</p>
                      <p>{Number(selectedGojo.peopleCount || 0)}</p>
                    </div>

                    <div className="rounded-2xl bg-[#f7fbf2] p-3">
                      <p className="text-xs text-[#064e2b]/45">የመቀመጫ ዋጋ</p>
                      <p>{formatMoney(selectedGojo.seatPrice)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="soft-card rounded-[2rem] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.2em] text-[#087443]">
                    የሽያጭ ማጠቃለያ
                  </p>

                  <h2 className="mt-2 flex items-center gap-2 text-xl font-black text-[#052e1a]">
                    <CircleDollarSign size={22} />
                    የምርት ድምር
                  </h2>
                </div>

                <div className="rounded-2xl bg-[#064e2b]/8 p-3 text-[#064e2b]">
                  <Clock3 size={22} />
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {summary?.productTotals?.map((product) => (
                  <div
                    key={product.name}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-white p-3 text-sm"
                  >
                    <div>
                      <p className="font-black text-[#052e1a]">
                        {product.name}
                      </p>
                      <p className="text-xs font-bold text-[#064e2b]/55">
                        ብዛት፡ {product.quantity}
                      </p>
                    </div>

                    <span className="font-black text-[#087443]">
                      {formatMoney(product.total)}
                    </span>
                  </div>
                ))}

                {!summary?.productTotals?.length && (
                  <p className="rounded-2xl bg-white p-4 text-sm font-bold text-[#064e2b]/60">
                    እስካሁን የምርት ድምር የለም።
                  </p>
                )}
              </div>

              <div className="mt-4 rounded-[1.5rem] bg-[#052e1a] p-5 text-white">
                <p className="text-sm font-bold text-white/60">
                  የዛሬ አጠቃላይ ድምር
                </p>

                <p className="mt-1 text-4xl font-black text-[#f5d36a]">
                  {formatMoney(summary?.totals?.grandTotal)}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}