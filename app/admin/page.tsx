// "use client";

// import { useEffect, useMemo, useRef, useState } from "react";
// import { TopNav } from "@/components/TopNav";
// import {
//   AlertCircle,
//   CalendarDays,
//   CheckCircle2,
//   CircleDollarSign,
//   Coffee,
//   Home,
//   Loader2,
//   Package,
//   Pencil,
//   Plus,
//   ReceiptText,
//   RefreshCw,
//   Save,
//   Search,
//   Tag,
//   TrendingUp,
//   Trash2,
//   Users,
//   X,
// } from "lucide-react";

// type Summary = {
//   byGojo: any[];
//   productTotals: any[];
//   totals: any;
// };

// type SalesRange = "today" | "week" | "month" | "three_months" | "all";

// type Product = {
//   id: string;
//   name: string;
//   category: string;
//   price: string | number;
//   unit: string;
// };

// type ProductForm = {
//   id: string;
//   name: string;
//   category: string;
//   price: string;
//   unit: string;
// };

// const EMPTY_PRODUCT_FORM: ProductForm = {
//   id: "",
//   name: "",
//   category: "",
//   price: "",
//   unit: "item",
// };

// const SALES_RANGES: Array<{
//   value: SalesRange;
//   label: string;
//   shortLabel: string;
// }> = [
//   { value: "today", label: "Today", shortLabel: "Today" },
//   { value: "week", label: "This week", shortLabel: "Week" },
//   { value: "month", label: "This month", shortLabel: "Month" },
//   { value: "three_months", label: "Last 3 months", shortLabel: "3 months" },
//   { value: "all", label: "All time", shortLabel: "All time" },
// ];

// type Notice = {
//   type: "success" | "error" | "info";
//   text: string;
// };

// async function readJsonSafe(url: string, signal?: AbortSignal) {
//   const res = await fetch(url, {
//     cache: "no-store",
//     signal,
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
//   return `${Number(value || 0).toFixed(0)} ETB`;
// }

// function formatNumber(value: any) {
//   return Number(value || 0).toLocaleString();
// }

// export default function AdminPage() {
//   const [summary, setSummary] = useState<Summary | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [notice, setNotice] = useState<Notice | null>(null);
//   const [salesRange, setSalesRange] = useState<SalesRange>("today");
//   const [selectedGojo, setSelectedGojo] = useState<any | null>(null);
//   const [productManagerOpen, setProductManagerOpen] = useState(false);
//   const [products, setProducts] = useState<Product[]>([]);
//   const [productsLoading, setProductsLoading] = useState(false);
//   const [productSaving, setProductSaving] = useState(false);
//   const [productDeleting, setProductDeleting] = useState(false);
//   const [productSearch, setProductSearch] = useState("");
//   const [productForm, setProductForm] = useState<ProductForm>(EMPTY_PRODUCT_FORM);

//   const loadingRef = useRef(false);
//   const activeControllerRef = useRef<AbortController | null>(null);
//   const requestIdRef = useRef(0);

//   async function load(
//     manual = false,
//     range: SalesRange = salesRange,
//     signal?: AbortSignal,
//   ) {
//     if (loadingRef.current) return;

//     const requestId = ++requestIdRef.current;
//     loadingRef.current = true;

//     try {
//       if (manual) setRefreshing(true);
//       setNotice(null);

//       const data = await readJsonSafe(
//         `/api/summary?range=${range}`,
//         signal,
//       );

//       if (signal?.aborted || requestId !== requestIdRef.current) return;

//       setSummary({
//         byGojo: Array.isArray(data.byGojo) ? data.byGojo : [],
//         productTotals: Array.isArray(data.productTotals)
//           ? data.productTotals
//           : [],
//         totals: data.totals || {},
//       });

//       if (manual) {
//         setNotice({
//           type: "success",
//           text: `${SALES_RANGES.find((item) => item.value === range)?.label || "Selected period"} refreshed successfully.`,
//         });
//       }
//     } catch (error: any) {
//       if (
//         signal?.aborted ||
//         error?.name === "AbortError" ||
//         requestId !== requestIdRef.current
//       ) {
//         return;
//       }

//       console.error("Failed to load admin dashboard:", error);

//       setNotice({
//         type: "error",
//         text:
//           error?.message ||
//           "Failed to load admin dashboard. Please refresh again.",
//       });
//     } finally {
//       if (requestId === requestIdRef.current) {
//         setLoading(false);
//         setRefreshing(false);
//         loadingRef.current = false;
//       }
//     }
//   }

//   async function loadProducts() {
//     setProductsLoading(true);

//     try {
//       /*
//        * Reuse the same endpoint that already powers the customer menu.
//        * It returns the existing Gojo and product records.
//        */
//       const data = await readJsonSafe("/api/bootstrap");

//       const existingProducts: Product[] = Array.isArray(data.products)
//         ? data.products.map((product: any) => ({
//             id: String(product.id || ""),
//             name: String(product.name || ""),
//             category: String(product.category || ""),
//             price: product.price ?? 0,
//             unit: String(product.unit || "item"),
//           }))
//         : [];

//       setProducts(existingProducts);
//     } catch (error: any) {
//       console.error("Failed to load products:", error);

//       setNotice({
//         type: "error",
//         text: error?.message || "Failed to load products.",
//       });
//     } finally {
//       setProductsLoading(false);
//     }
//   }

//   async function openProductManager() {
//     setProductManagerOpen(true);
//     setProductForm(EMPTY_PRODUCT_FORM);
//     await loadProducts();
//   }

//   function selectProduct(product: Product) {
//     setProductForm({
//       id: product.id,
//       name: product.name || "",
//       category: product.category || "",
//       price: String(product.price ?? ""),
//       unit: product.unit || "item",
//     });
//   }

//   function startNewProduct() {
//     setProductForm(EMPTY_PRODUCT_FORM);
//   }

//   async function deleteProduct() {
//     if (!productForm.id) return;

//     const productName = productForm.name.trim() || "this product";

//     const confirmed = window.confirm(
//       `Delete ${productName}? This action cannot be undone.`,
//     );

//     if (!confirmed) return;

//     setProductDeleting(true);

//     try {
//       const res = await fetch(`/api/products/${productForm.id}`, {
//         method: "DELETE",
//       });

//       const text = await res.text();
//       let data: any = {};

//       if (text.trim()) {
//         try {
//           data = JSON.parse(text);
//         } catch {
//           data = {};
//         }
//       }

//       if (!res.ok) {
//         throw new Error(
//           data?.error || text || `Failed to delete product (${res.status}).`,
//         );
//       }

//       setNotice({
//         type: "success",
//         text: `${productName} deleted successfully.`,
//       });

//       setProductForm(EMPTY_PRODUCT_FORM);
//       await loadProducts();
//     } catch (error: any) {
//       console.error("Failed to delete product:", error);
//       setNotice({
//         type: "error",
//         text: error?.message || "Failed to delete product.",
//       });
//     } finally {
//       setProductDeleting(false);
//     }
//   }

//   async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
//     event.preventDefault();

//     const name = productForm.name.trim();
//     const category = productForm.category.trim();
//     const unit = productForm.unit.trim();
//     const price = Number(productForm.price);

//     if (!name || !category || !unit) {
//       setNotice({ type: "error", text: "Name, category, and unit are required." });
//       return;
//     }

//     if (!Number.isFinite(price) || price < 0) {
//       setNotice({ type: "error", text: "Enter a valid product price." });
//       return;
//     }

//     setProductSaving(true);

//     try {
//       const isEditing = Boolean(productForm.id);

//       const res = await fetch(
//         isEditing
//           ? `/api/products/${productForm.id}`
//           : "/api/products",
//         {
//           method: isEditing ? "PATCH" : "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             name,
//             category,
//             price,
//             unit,
//           }),
//         },
//       );

//       const text = await res.text();

//       let data: any = {};

//       if (text.trim()) {
//         try {
//           data = JSON.parse(text);
//         } catch {
//           data = {};
//         }
//       }

//       if (!res.ok) {
//         throw new Error(
//           data?.error ||
//             text ||
//             `Failed to save product (${res.status}).`,
//         );
//       }

//       setNotice({
//         type: "success",
//         text: productForm.id
//           ? `${name} updated successfully.`
//           : `${name} added successfully.`,
//       });

//       await loadProducts();

//       if (data.product) {
//         selectProduct(data.product);
//       } else {
//         setProductForm(EMPTY_PRODUCT_FORM);
//       }
//     } catch (error: any) {
//       console.error("Failed to save product:", error);
//       setNotice({
//         type: "error",
//         text: error?.message || "Failed to save product.",
//       });
//     } finally {
//       setProductSaving(false);
//     }
//   }

//   useEffect(() => {
//     let disposed = false;
//     let timer: ReturnType<typeof setTimeout> | null = null;

//     activeControllerRef.current?.abort();
//     const controller = new AbortController();
//     activeControllerRef.current = controller;

//     // Allow a new range request to start immediately.
//     loadingRef.current = false;
//     setLoading(true);

//     const poll = async () => {
//       if (disposed || controller.signal.aborted) return;

//       await load(false, salesRange, controller.signal);

//       if (!disposed && !controller.signal.aborted) {
//         timer = setTimeout(poll, 5000);
//       }
//     };

//     void poll();

//     return () => {
//       disposed = true;
//       controller.abort();
//       if (timer) clearTimeout(timer);
//     };
//   }, [salesRange]);

//   useEffect(() => {
//     if (!selectedGojo && !productManagerOpen) return;

//     const handleKeyDown = (event: KeyboardEvent) => {
//       if (event.key === "Escape") {
//         setSelectedGojo(null);
//         setProductManagerOpen(false);
//       }
//     };

//     const previousOverflow = document.body.style.overflow;
//     document.body.style.overflow = "hidden";
//     window.addEventListener("keydown", handleKeyDown);

//     return () => {
//       document.body.style.overflow = previousOverflow;
//       window.removeEventListener("keydown", handleKeyDown);
//     };
//   }, [selectedGojo, productManagerOpen]);

//   const activeGojos = useMemo(() => {
//     return (
//       summary?.byGojo?.filter((row) => Number(row.grandTotal || 0) > 0) || []
//     );
//   }, [summary]);

//   const topGojo = useMemo(() => {
//     const rows = summary?.byGojo || [];

//     if (!rows.length) return null;

//     return [...rows].sort(
//       (a, b) => Number(b.grandTotal || 0) - Number(a.grandTotal || 0),
//     )[0];
//   }, [summary]);

//   const totalPeople = useMemo(() => {
//     return (
//       summary?.byGojo?.reduce(
//         (sum, row) => sum + Number(row.peopleCount || 0),
//         0,
//       ) || 0
//     );
//   }, [summary]);

//   const totalQuantity = useMemo(() => {
//     return (
//       summary?.productTotals?.reduce(
//         (sum, product) => sum + Number(product.quantity || 0),
//         0,
//       ) || 0
//     );
//   }, [summary]);

//   const filteredProducts = useMemo(() => {
//     const query = productSearch.trim().toLowerCase();

//     if (!query) return products;

//     return products.filter((product) =>
//       [product.name, product.category, product.unit]
//         .join(" ")
//         .toLowerCase()
//         .includes(query),
//     );
//   }, [products, productSearch]);

//   const selectedRangeLabel =
//     SALES_RANGES.find((item) => item.value === salesRange)?.label ||
//     "Selected period";

//   const orderTotal = Number(summary?.totals?.orderTotal || 0);
//   const seatTotal = Number(summary?.totals?.seatTotal || 0);
//   const grandTotal = Number(summary?.totals?.grandTotal || 0);

//   return (
//     <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(215,169,52,0.14),transparent_34%),linear-gradient(135deg,#f5f7ef,#e8f5ec_45%,#f7f3df)] pb-10">
//       <TopNav title="Admin Dashboard" />

//       <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
//         <div className="mb-6 overflow-hidden rounded-[2rem] bg-[#052e1a] shadow-2xl sm:rounded-[2.75rem]">
//           <div className="relative p-6 text-white sm:p-8 lg:p-10">
//             <div className="absolute right-[-80px] top-[-90px] h-64 w-64 rounded-full bg-[#d7a934]/20 blur-3xl" />
//             <div className="absolute bottom-[-100px] left-[-80px] h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

//             <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
//               <div>
//                 <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[.22em] text-[#f5d36a]">
//                   <TrendingUp size={15} />
//                   Owner control center
//                 </div>

//                 <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
//                   Ambo Menafesha daily dashboard
//                 </h1>

//                 <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/70 sm:text-base">
//                   Monitor each gojo/home, product sales, seat charges, and
//                   payment totals for the selected sales period.
//                 </p>
//               </div>

//               <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur sm:min-w-[330px]">
//                 <p className="text-sm font-bold text-white/60">
//                   {selectedRangeLabel} grand total
//                 </p>

//                 <p className="mt-2 text-4xl font-black text-[#f5d36a]">
//                   {loading ? "..." : formatMoney(grandTotal)}
//                 </p>

//                 <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
//                   <div className="rounded-2xl bg-white/10 p-3">
//                     <p className="text-white/50">People</p>
//                     <p className="font-black">{formatNumber(totalPeople)}</p>
//                   </div>

//                   <div className="rounded-2xl bg-white/10 p-3">
//                     <p className="text-white/50">Items</p>
//                     <p className="font-black">{formatNumber(totalQuantity)}</p>
//                   </div>
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

//         <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//           <div>
//             <p className="text-xs font-black uppercase tracking-[.24em] text-[#087443]">
//               Live financial overview
//             </p>
//             <h2 className="mt-1 text-2xl font-black text-[#052e1a]">
//               {selectedRangeLabel} totals
//             </h2>
//           </div>

//           <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
//             <button
//               type="button"
//               onClick={openProductManager}
//               className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#064e2b]/15 bg-white px-5 py-3 font-black text-[#064e2b] shadow-sm transition hover:bg-[#eef7f0] sm:w-auto"
//             >
//               <Package size={18} />
//               Manage Products
//             </button>

//             <button
//               type="button"
//               onClick={() => load(true, salesRange)}
//               disabled={refreshing || loading}
//               className="btn-primary w-full rounded-2xl px-5 py-3 font-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
//             >
//               {refreshing ? (
//                 <>
//                   <Loader2 size={18} className="mr-2 inline animate-spin" />
//                   Refreshing
//                 </>
//               ) : (
//                 <>
//                   <RefreshCw size={18} className="mr-2 inline" />
//                   Refresh Dashboard
//                 </>
//               )}
//             </button>
//           </div>
//         </div>

//         <div className="mb-6 rounded-[2rem] border border-[#064e2b]/10 bg-white/90 p-3 shadow-sm backdrop-blur">
//           <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
//             <div className="flex items-center gap-3 px-2">
//               <div className="rounded-2xl bg-[#064e2b]/8 p-3 text-[#064e2b]">
//                 <CalendarDays size={21} />
//               </div>
//               <div>
//                 <p className="text-sm font-black text-[#052e1a]">
//                   Sales period
//                 </p>
//                 <p className="text-xs font-semibold text-[#064e2b]/55">
//                   Every total and table follows this selection
//                 </p>
//               </div>
//             </div>

//             <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
//               {SALES_RANGES.map((range) => {
//                 const active = salesRange === range.value;

//                 return (
//                   <button
//                     key={range.value}
//                     type="button"
//                     onClick={() => setSalesRange(range.value)}
//                     className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
//                       active
//                         ? "bg-[#052e1a] text-[#f5d36a] shadow-lg"
//                         : "border border-[#064e2b]/10 bg-[#f5f8f3] text-[#064e2b] hover:bg-[#eaf4ed]"
//                     }`}
//                   >
//                     {range.shortLabel}
//                   </button>
//                 );
//               })}
//             </div>
//           </div>
//         </div>

//         {loading ? (
//           <div className="grid gap-4 md:grid-cols-3">
//             {[1, 2, 3].map((item) => (
//               <div
//                 key={item}
//                 className="soft-card animate-pulse rounded-[2rem] p-6"
//               >
//                 <div className="h-4 w-32 rounded-full bg-[#064e2b]/10" />
//                 <div className="mt-4 h-9 w-48 rounded-full bg-[#064e2b]/10" />
//                 <div className="mt-3 h-4 w-28 rounded-full bg-[#064e2b]/10" />
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="grid gap-4 md:grid-cols-3">
//             <div className="soft-card rounded-[2rem] p-6">
//               <div className="flex items-start justify-between gap-4">
//                 <div>
//                   <p className="flex items-center gap-2 text-sm font-black text-[#087443]">
//                     <CircleDollarSign size={18} />
//                     Orders
//                   </p>

//                   <h2 className="mt-2 text-3xl font-black text-[#052e1a]">
//                     {formatMoney(orderTotal)}
//                   </h2>

//                   <p className="mt-1 text-sm font-semibold text-[#064e2b]/55">
//                     Food and drink order total
//                   </p>
//                 </div>

//                 <div className="rounded-2xl bg-[#064e2b]/8 p-3 text-[#064e2b]">
//                   <ReceiptText size={24} />
//                 </div>
//               </div>
//             </div>

//             <div className="soft-card rounded-[2rem] p-6">
//               <div className="flex items-start justify-between gap-4">
//                 <div>
//                   <p className="flex items-center gap-2 text-sm font-black text-[#087443]">
//                     <Users size={18} />
//                     Seat charges
//                   </p>

//                   <h2 className="mt-2 text-3xl font-black text-[#052e1a]">
//                     {formatMoney(seatTotal)}
//                   </h2>

//                   <p className="mt-1 text-sm font-semibold text-[#064e2b]/55">
//                     People count × seat price
//                   </p>
//                 </div>

//                 <div className="rounded-2xl bg-[#064e2b]/8 p-3 text-[#064e2b]">
//                   <Users size={24} />
//                 </div>
//               </div>
//             </div>

//             <div className="rounded-[2rem] bg-[#052e1a] p-6 text-white shadow-2xl">
//               <div className="flex items-start justify-between gap-4">
//                 <div>
//                   <p className="flex items-center gap-2 text-sm font-black text-[#d7a934]">
//                     <Home size={18} />
//                     Grand total
//                   </p>

//                   <h2 className="mt-2 text-3xl font-black text-[#f5d36a]">
//                     {formatMoney(grandTotal)}
//                   </h2>

//                   <p className="mt-1 text-sm font-semibold text-white/55">
//                     Full payment for {selectedRangeLabel.toLowerCase()}
//                   </p>
//                 </div>

//                 <div className="rounded-2xl bg-white/10 p-3 text-[#f5d36a]">
//                   <TrendingUp size={24} />
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
//           <div className="soft-card overflow-hidden rounded-[2rem]">
//             <div className="flex flex-col gap-3 border-b border-[#064e2b]/10 p-5 sm:flex-row sm:items-center sm:justify-between">
//               <div>
//                 <p className="text-xs font-black uppercase tracking-[.22em] text-[#087443]">
//                   Gojo/Home control
//                 </p>

//                 <h2 className="mt-1 text-2xl font-black text-[#052e1a]">
//                   Gojo/Home totals
//                 </h2>
//                 <p className="mt-1 text-xs font-semibold text-[#064e2b]/55">
//                   Click any row to view the complete breakdown
//                 </p>
//               </div>

//               <div className="rounded-2xl bg-[#064e2b]/8 px-4 py-3 text-sm font-black text-[#064e2b]">
//                 {activeGojos.length} active gojo
//                 {activeGojos.length === 1 ? "" : "s"}
//               </div>
//             </div>

//             {loading ? (
//               <div className="space-y-3 p-5">
//                 {[1, 2, 3, 4].map((item) => (
//                   <div
//                     key={item}
//                     className="h-16 animate-pulse rounded-2xl bg-[#064e2b]/8"
//                   />
//                 ))}
//               </div>
//             ) : (
//               <>
//                 <div className="hidden overflow-x-auto lg:block">
//                   <table className="w-full min-w-[760px] text-left text-sm">
//                     <thead className="bg-[#064e2b]/8 text-[#064e2b]">
//                       <tr>
//                         <th className="p-4">Gojo</th>
//                         <th className="p-4">People</th>
//                         <th className="p-4">Seat price</th>
//                         <th className="p-4">Order total</th>
//                         <th className="p-4">Seat total</th>
//                         <th className="p-4">Total payment</th>
//                       </tr>
//                     </thead>

//                     <tbody>
//                       {summary?.byGojo?.map((row) => (
//                         <tr
//                           key={row.gojo.id}
//                           tabIndex={0}
//                           role="button"
//                           onClick={() => setSelectedGojo(row)}
//                           onKeyDown={(event) => {
//                             if (event.key === "Enter" || event.key === " ") {
//                               event.preventDefault();
//                               setSelectedGojo(row);
//                             }
//                           }}
//                           className={`cursor-pointer border-t outline-none transition focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#087443] ${
//                             Number(row.grandTotal || 0) > 0
//                               ? "border-emerald-200/70 bg-emerald-50/70 hover:bg-emerald-100/70"
//                               : "border-slate-200 bg-slate-100/80 text-slate-500 hover:bg-slate-200/80"
//                           }`}
//                         >
//                           <td className="p-4 font-black text-[#052e1a]">
//                             {row.gojo.name}
//                           </td>

//                           <td className="p-4 font-bold text-[#064e2b]/75">
//                             {formatNumber(row.peopleCount)}
//                           </td>

//                           <td className="p-4 font-bold text-[#064e2b]/75">
//                             {formatMoney(row.seatPrice)}
//                           </td>

//                           <td className="p-4 font-bold text-[#064e2b]/75">
//                             {formatMoney(row.orderTotal)}
//                           </td>

//                           <td className="p-4 font-bold text-[#064e2b]/75">
//                             {formatMoney(row.seatTotal)}
//                           </td>

//                           <td className="p-4">
//                             <div className="flex items-center gap-2">
//                               <span
//                                 className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${
//                                   Number(row.grandTotal || 0) > 0
//                                     ? "bg-emerald-600 text-white"
//                                     : "bg-slate-300 text-slate-700"
//                                 }`}
//                               >
//                                 {Number(row.grandTotal || 0) > 0
//                                   ? "Payment"
//                                   : "No payment"}
//                               </span>
//                               <span
//                                 className={`font-black ${
//                                   Number(row.grandTotal || 0) > 0
//                                     ? "text-emerald-800"
//                                     : "text-slate-500"
//                                 }`}
//                               >
//                                 {formatMoney(row.grandTotal)}
//                               </span>
//                             </div>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>

//                 <div className="space-y-3 p-5 lg:hidden">
//                   {summary?.byGojo?.map((row) => (
//                     <button
//                       key={row.gojo.id}
//                       type="button"
//                       onClick={() => setSelectedGojo(row)}
//                       className={`w-full rounded-[1.5rem] border p-4 text-left transition active:scale-[0.99] ${
//                         Number(row.grandTotal || 0) > 0
//                           ? "border-emerald-200 bg-emerald-50/80"
//                           : "border-slate-200 bg-slate-100/90"
//                       }`}
//                     >
//                       <div className="flex items-start justify-between gap-3">
//                         <div>
//                           <p className="font-black text-[#052e1a]">
//                             {row.gojo.name}
//                           </p>

//                           <p className="mt-1 text-xs font-bold text-[#064e2b]/55">
//                             People: {formatNumber(row.peopleCount)} · Seat:{" "}
//                             {formatMoney(row.seatPrice)}
//                           </p>
//                         </div>

//                         <div className="text-right">
//                           <span
//                             className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
//                               Number(row.grandTotal || 0) > 0
//                                 ? "bg-emerald-600 text-white"
//                                 : "bg-slate-300 text-slate-700"
//                             }`}
//                           >
//                             {Number(row.grandTotal || 0) > 0
//                               ? "Payment"
//                               : "No payment"}
//                           </span>
//                           <p
//                             className={`mt-1 font-black ${
//                               Number(row.grandTotal || 0) > 0
//                                 ? "text-emerald-800"
//                                 : "text-slate-500"
//                             }`}
//                           >
//                             {formatMoney(row.grandTotal)}
//                           </p>
//                         </div>
//                       </div>

//                       <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
//                         <div className="rounded-2xl bg-[#f7fbf2] p-3">
//                           <p className="text-xs font-bold text-[#064e2b]/45">
//                             Orders
//                           </p>
//                           <p className="font-black text-[#052e1a]">
//                             {formatMoney(row.orderTotal)}
//                           </p>
//                         </div>

//                         <div className="rounded-2xl bg-[#f7fbf2] p-3">
//                           <p className="text-xs font-bold text-[#064e2b]/45">
//                             Seat total
//                           </p>
//                           <p className="font-black text-[#052e1a]">
//                             {formatMoney(row.seatTotal)}
//                           </p>
//                         </div>
//                       </div>
//                     </button>
//                   ))}
//                 </div>

//                 {!summary?.byGojo?.length && (
//                   <div className="p-8 text-center">
//                     <p className="text-lg font-black text-[#052e1a]">
//                       No gojo data yet
//                     </p>
//                     <p className="mt-1 text-sm font-semibold text-[#064e2b]/60">
//                       Once staff enters gojo billing or orders arrive, totals
//                       will appear here.
//                     </p>
//                   </div>
//                 )}
//               </>
//             )}
//           </div>

//           <aside className="space-y-6">
//             <div className="soft-card rounded-[2rem] p-5">
//               <div className="flex items-start justify-between gap-4">
//                 <div>
//                   <p className="text-xs font-black uppercase tracking-[.22em] text-[#087443]">
//                     Classified totals
//                   </p>

//                   <h2 className="mt-2 flex items-center gap-2 text-2xl font-black text-[#052e1a]">
//                     <Coffee />
//                     Products
//                   </h2>
//                 </div>

//                 <div className="rounded-2xl bg-[#064e2b]/8 p-3 text-[#064e2b]">
//                   <Coffee size={24} />
//                 </div>
//               </div>

//               <div className="mt-5 space-y-3">
//                 {loading &&
//                   [1, 2, 3].map((item) => (
//                     <div
//                       key={item}
//                       className="h-20 animate-pulse rounded-2xl bg-[#064e2b]/8"
//                     />
//                   ))}

//                 {!loading &&
//                   summary?.productTotals?.map((product) => (
//                     <div
//                       key={product.name}
//                       className="rounded-2xl border border-[#064e2b]/10 bg-white p-4"
//                     >
//                       <div className="flex items-start justify-between gap-4">
//                         <div>
//                           <p className="font-black text-[#052e1a]">
//                             {product.name}
//                           </p>

//                           <p className="mt-1 text-sm font-semibold text-[#064e2b]/65">
//                             {product.category} · quantity{" "}
//                             {formatNumber(product.quantity)}
//                           </p>
//                         </div>

//                         <p className="text-right font-black text-[#087443]">
//                           {formatMoney(product.total)}
//                         </p>
//                       </div>
//                     </div>
//                   ))}

//                 {!loading && !summary?.productTotals?.length && (
//                   <div className="rounded-[1.5rem] bg-white p-5 text-center">
//                     <p className="font-black text-[#052e1a]">
//                       No product sales yet
//                     </p>
//                     <p className="mt-1 text-sm font-semibold text-[#064e2b]/60">
//                       Classified totals will appear after orders are placed.
//                     </p>
//                   </div>
//                 )}
//               </div>
//             </div>

//             <div className="rounded-[2rem] bg-[#052e1a] p-5 text-white shadow-2xl">
//               <p className="text-xs font-black uppercase tracking-[.2em] text-[#f5d36a]">
//                 Top gojo/home
//               </p>

//               {topGojo ? (
//                 <>
//                   <h3 className="mt-3 text-2xl font-black">
//                     {topGojo.gojo.name}
//                   </h3>

//                   <p className="mt-1 text-sm font-semibold text-white/60">
//                     Highest total payment for {selectedRangeLabel.toLowerCase()}
//                   </p>

//                   <div className="mt-5 rounded-[1.5rem] bg-white/10 p-4">
//                     <p className="text-sm font-bold text-white/55">
//                       Total payment
//                     </p>
//                     <p className="mt-1 text-3xl font-black text-[#f5d36a]">
//                       {formatMoney(topGojo.grandTotal)}
//                     </p>
//                   </div>
//                 </>
//               ) : (
//                 <p className="mt-3 text-sm font-semibold text-white/60">
//                   No gojo totals available yet.
//                 </p>
//               )}
//             </div>
//           </aside>
//         </div>
//       </section>

//       {productManagerOpen && (
//         <div
//           className="fixed inset-0 z-[90] flex items-center justify-center bg-[#02180d]/70 p-3 backdrop-blur-sm sm:p-6"
//           onMouseDown={(event) => {
//             if (event.currentTarget === event.target) {
//               setProductManagerOpen(false);
//             }
//           }}
//         >
//           <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-white/20 bg-[#f6f9f3] shadow-2xl sm:rounded-[2.5rem]">
//             <div className="flex items-center justify-between gap-4 border-b border-[#064e2b]/10 bg-white px-5 py-4 sm:px-7">
//               <div>
//                 <p className="text-xs font-black uppercase tracking-[.2em] text-[#087443]">
//                   Menu control
//                 </p>
//                 <h2 className="mt-1 text-2xl font-black text-[#052e1a]">
//                   Product Management
//                 </h2>
//                 <p className="mt-1 text-sm font-semibold text-[#064e2b]/55">
//                   Add a product or click an existing product to edit it.
//                 </p>
//               </div>

//               <button
//                 type="button"
//                 onClick={() => setProductManagerOpen(false)}
//                 className="rounded-2xl bg-[#064e2b]/8 p-3 text-[#064e2b] transition hover:bg-[#064e2b]/15"
//                 aria-label="Close product manager"
//               >
//                 <X size={22} />
//               </button>
//             </div>

//             <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[1.05fr_.95fr] lg:overflow-hidden">
//               <section className="border-b border-[#064e2b]/10 p-4 sm:p-6 lg:overflow-y-auto lg:border-b-0 lg:border-r">
//                 <div className="flex flex-col gap-3 sm:flex-row">
//                   <label className="relative flex-1">
//                     <Search
//                       size={18}
//                       className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#064e2b]/45"
//                     />
//                     <input
//                       value={productSearch}
//                       onChange={(event) => setProductSearch(event.target.value)}
//                       placeholder="Search products..."
//                       className="w-full rounded-2xl border border-[#064e2b]/12 bg-white py-3 pl-11 pr-4 font-semibold text-[#052e1a] outline-none transition focus:border-[#087443] focus:ring-4 focus:ring-emerald-100"
//                     />
//                   </label>

//                   <button
//                     type="button"
//                     onClick={startNewProduct}
//                     className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#052e1a] px-5 py-3 font-black text-[#f5d36a] shadow-lg transition hover:bg-[#064e2b]"
//                   >
//                     <Plus size={18} />
//                     New Product
//                   </button>
//                 </div>

//                 <div className="mt-5 space-y-3">
//                   {productsLoading &&
//                     [1, 2, 3, 4].map((item) => (
//                       <div
//                         key={item}
//                         className="h-20 animate-pulse rounded-2xl bg-[#064e2b]/8"
//                       />
//                     ))}

//                   {!productsLoading &&
//                     filteredProducts.map((product) => {
//                       const selected = productForm.id === product.id;

//                       return (
//                         <button
//                           key={product.id}
//                           type="button"
//                           onClick={() => selectProduct(product)}
//                           className={`flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition ${
//                             selected
//                               ? "border-[#087443] bg-emerald-50 shadow-md ring-2 ring-emerald-100"
//                               : "border-[#064e2b]/10 bg-white hover:border-[#087443]/35 hover:bg-[#f4faf5]"
//                           }`}
//                         >
//                           <div className="min-w-0">
//                             <div className="flex items-center gap-2">
//                               <p className="truncate font-black text-[#052e1a]">
//                                 {product.name}
//                               </p>
//                               {selected && (
//                                 <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
//                                   Editing
//                                 </span>
//                               )}
//                             </div>
//                             <p className="mt-1 truncate text-sm font-semibold text-[#064e2b]/55">
//                               {product.category} · per {product.unit}
//                             </p>
//                           </div>

//                           <div className="flex shrink-0 items-center gap-3">
//                             <p className="font-black text-[#087443]">
//                               {formatMoney(product.price)}
//                             </p>
//                             <Pencil size={17} className="text-[#064e2b]/45" />
//                           </div>
//                         </button>
//                       );
//                     })}

//                   {!productsLoading && !filteredProducts.length && (
//                     <div className="rounded-[1.5rem] border border-dashed border-[#064e2b]/20 bg-white p-8 text-center">
//                       <Package size={30} className="mx-auto text-[#064e2b]/35" />
//                       <p className="mt-3 font-black text-[#052e1a]">
//                         No products found
//                       </p>
//                       <p className="mt-1 text-sm font-semibold text-[#064e2b]/50">
//                         Clear the search or create a new product.
//                       </p>
//                     </div>
//                   )}
//                 </div>
//               </section>

//               <section className="p-4 sm:p-6 lg:overflow-y-auto">
//                 <div className="rounded-[1.75rem] bg-[#052e1a] p-5 text-white shadow-xl">
//                   <div className="flex items-start justify-between gap-4">
//                     <div>
//                       <p className="text-xs font-black uppercase tracking-[.2em] text-[#f5d36a]">
//                         {productForm.id ? "Edit product" : "Add product"}
//                       </p>
//                       <h3 className="mt-2 text-2xl font-black">
//                         {productForm.id
//                           ? productForm.name || "Selected product"
//                           : "Create menu item"}
//                       </h3>
//                     </div>
//                     <div className="rounded-2xl bg-white/10 p-3 text-[#f5d36a]">
//                       {productForm.id ? <Pencil size={23} /> : <Plus size={23} />}
//                     </div>
//                   </div>
//                 </div>

//                 <form onSubmit={saveProduct} className="mt-5 space-y-4">
//                   <label className="block">
//                     <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#052e1a]">
//                       <Package size={16} /> Product name
//                     </span>
//                     <input
//                       value={productForm.name}
//                       onChange={(event) =>
//                         setProductForm((current) => ({
//                           ...current,
//                           name: event.target.value,
//                         }))
//                       }
//                       placeholder="Example: Buna"
//                       className="w-full rounded-2xl border border-[#064e2b]/12 bg-white px-4 py-3.5 font-semibold text-[#052e1a] outline-none transition focus:border-[#087443] focus:ring-4 focus:ring-emerald-100"
//                     />
//                   </label>

//                   <label className="block">
//                     <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#052e1a]">
//                       <Tag size={16} /> Category
//                     </span>
//                     <input
//                       value={productForm.category}
//                       onChange={(event) =>
//                         setProductForm((current) => ({
//                           ...current,
//                           category: event.target.value,
//                         }))
//                       }
//                       placeholder="Example: Hot drinks"
//                       className="w-full rounded-2xl border border-[#064e2b]/12 bg-white px-4 py-3.5 font-semibold text-[#052e1a] outline-none transition focus:border-[#087443] focus:ring-4 focus:ring-emerald-100"
//                     />
//                   </label>

//                   <div className="grid gap-4 sm:grid-cols-2">
//                     <label className="block">
//                       <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#052e1a]">
//                         <CircleDollarSign size={16} /> Price (ETB)
//                       </span>
//                       <input
//                         type="number"
//                         min="0"
//                         step="0.01"
//                         value={productForm.price}
//                         onChange={(event) =>
//                           setProductForm((current) => ({
//                             ...current,
//                             price: event.target.value,
//                           }))
//                         }
//                         placeholder="0"
//                         className="w-full rounded-2xl border border-[#064e2b]/12 bg-white px-4 py-3.5 font-semibold text-[#052e1a] outline-none transition focus:border-[#087443] focus:ring-4 focus:ring-emerald-100"
//                       />
//                     </label>

//                     <label className="block">
//                       <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#052e1a]">
//                         <Tag size={16} /> Unit
//                       </span>
//                       <input
//                         value={productForm.unit}
//                         onChange={(event) =>
//                           setProductForm((current) => ({
//                             ...current,
//                             unit: event.target.value,
//                           }))
//                         }
//                         placeholder="cup, bottle, plate..."
//                         className="w-full rounded-2xl border border-[#064e2b]/12 bg-white px-4 py-3.5 font-semibold text-[#052e1a] outline-none transition focus:border-[#087443] focus:ring-4 focus:ring-emerald-100"
//                       />
//                     </label>
//                   </div>

//                   <div className="rounded-2xl border border-[#064e2b]/10 bg-white p-4 text-sm font-semibold text-[#064e2b]/65">
//                     Saved changes are returned by the products API and will be available to the customer menu on its next refresh.
//                   </div>

//                   <div className="grid gap-3 sm:grid-cols-2">
//                     {productForm.id && (
//                       <button
//                         type="button"
//                         onClick={deleteProduct}
//                         disabled={productSaving || productDeleting}
//                         className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
//                       >
//                         {productDeleting ? (
//                           <>
//                             <Loader2 size={19} className="animate-spin" />
//                             Deleting...
//                           </>
//                         ) : (
//                           <>
//                             <Trash2 size={19} />
//                             Delete Product
//                           </>
//                         )}
//                       </button>
//                     )}

//                     <button
//                       type="submit"
//                       disabled={productSaving || productDeleting}
//                       className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#087443] px-5 py-4 font-black text-white shadow-xl transition hover:bg-[#06663a] disabled:cursor-not-allowed disabled:opacity-60 ${
//                         productForm.id ? "" : "sm:col-span-2"
//                       }`}
//                     >
//                       {productSaving ? (
//                         <>
//                           <Loader2 size={19} className="animate-spin" />
//                           Saving product...
//                         </>
//                       ) : (
//                         <>
//                           <Save size={19} />
//                           {productForm.id ? "Save Changes" : "Add Product"}
//                         </>
//                       )}
//                     </button>
//                   </div>
//                 </form>
//               </section>
//             </div>
//           </div>
//         </div>
//       )}

//       {selectedGojo && (
//         <div
//           className="fixed inset-0 z-[100] flex items-end justify-center bg-[#02170d]/65 p-0 backdrop-blur-sm sm:items-center sm:p-5"
//           onMouseDown={(event) => {
//             if (event.target === event.currentTarget) {
//               setSelectedGojo(null);
//             }
//           }}
//         >
//           <div
//             role="dialog"
//             aria-modal="true"
//             aria-labelledby="gojo-detail-title"
//             className="max-h-[92vh] w-full overflow-hidden rounded-t-[2rem] bg-[#f7fbf2] shadow-2xl sm:max-w-3xl sm:rounded-[2rem]"
//           >
//             <div className="flex items-start justify-between gap-4 bg-[#052e1a] p-5 text-white sm:p-6">
//               <div>
//                 <p className="text-xs font-black uppercase tracking-[.22em] text-[#f5d36a]">
//                   {selectedRangeLabel} details
//                 </p>
//                 <h2 id="gojo-detail-title" className="mt-2 text-2xl font-black sm:text-3xl">
//                   {selectedGojo.gojo?.name || "Gojo/Home"}
//                 </h2>
//                 <p className="mt-1 text-sm font-semibold text-white/60">
//                   Full sales and seating breakdown
//                 </p>
//               </div>

//               <button
//                 type="button"
//                 onClick={() => setSelectedGojo(null)}
//                 className="rounded-2xl bg-white/10 p-3 text-white transition hover:bg-white/20"
//                 aria-label="Close details"
//               >
//                 <X size={22} />
//               </button>
//             </div>

//             <div className="max-h-[calc(92vh-120px)] overflow-y-auto p-4 sm:p-6">
//               <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
//                 <div className="rounded-[1.5rem] border border-[#064e2b]/10 bg-white p-4">
//                   <p className="text-xs font-black uppercase tracking-wide text-[#064e2b]/50">People</p>
//                   <p className="mt-2 text-2xl font-black text-[#052e1a]">{formatNumber(selectedGojo.peopleCount)}</p>
//                 </div>
//                 <div className="rounded-[1.5rem] border border-[#064e2b]/10 bg-white p-4">
//                   <p className="text-xs font-black uppercase tracking-wide text-[#064e2b]/50">Average seat price</p>
//                   <p className="mt-2 text-2xl font-black text-[#052e1a]">{formatMoney(selectedGojo.seatPrice)}</p>
//                 </div>
//                 <div className="rounded-[1.5rem] border border-[#064e2b]/10 bg-white p-4">
//                   <p className="text-xs font-black uppercase tracking-wide text-[#064e2b]/50">Order sales</p>
//                   <p className="mt-2 text-2xl font-black text-[#052e1a]">{formatMoney(selectedGojo.orderTotal)}</p>
//                 </div>
//                 <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4">
//                   <p className="text-xs font-black uppercase tracking-wide text-emerald-700/60">Grand total</p>
//                   <p className="mt-2 text-2xl font-black text-emerald-800">{formatMoney(selectedGojo.grandTotal)}</p>
//                 </div>
//               </div>

//               <div className="mt-5 grid gap-4 sm:grid-cols-2">
//                 <div className="rounded-[1.5rem] border border-[#064e2b]/10 bg-white p-5">
//                   <div className="flex items-center justify-between gap-3">
//                     <div>
//                       <p className="text-xs font-black uppercase tracking-[.18em] text-[#087443]">Seat calculation</p>
//                       <h3 className="mt-1 text-lg font-black text-[#052e1a]">Seating revenue</h3>
//                     </div>
//                     <Users className="text-[#087443]" />
//                   </div>
//                   <div className="mt-4 space-y-3 text-sm">
//                     <div className="flex justify-between gap-4"><span className="font-semibold text-[#064e2b]/60">People count</span><strong className="text-[#052e1a]">{formatNumber(selectedGojo.peopleCount)}</strong></div>
//                     <div className="flex justify-between gap-4"><span className="font-semibold text-[#064e2b]/60">Average seat price</span><strong className="text-[#052e1a]">{formatMoney(selectedGojo.seatPrice)}</strong></div>
//                     <div className="border-t border-[#064e2b]/10 pt-3 flex justify-between gap-4"><span className="font-black text-[#052e1a]">Seat total</span><strong className="text-[#087443]">{formatMoney(selectedGojo.seatTotal)}</strong></div>
//                   </div>
//                 </div>

//                 <div className="rounded-[1.5rem] border border-[#064e2b]/10 bg-white p-5">
//                   <div className="flex items-center justify-between gap-3">
//                     <div>
//                       <p className="text-xs font-black uppercase tracking-[.18em] text-[#087443]">Payment status</p>
//                       <h3 className="mt-1 text-lg font-black text-[#052e1a]">Period result</h3>
//                     </div>
//                     <CircleDollarSign className="text-[#087443]" />
//                   </div>
//                   <div className={`mt-4 rounded-2xl p-4 ${Number(selectedGojo.grandTotal || 0) > 0 ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
//                     <p className="text-xs font-black uppercase tracking-wide">{Number(selectedGojo.grandTotal || 0) > 0 ? "Payment recorded" : "No payment"}</p>
//                     <p className="mt-1 text-2xl font-black">{formatMoney(selectedGojo.grandTotal)}</p>
//                   </div>
//                 </div>
//               </div>

//               <div className="mt-5 rounded-[1.5rem] border border-[#064e2b]/10 bg-white p-5">
//                 <div className="flex items-center justify-between gap-3">
//                   <div>
//                     <p className="text-xs font-black uppercase tracking-[.18em] text-[#087443]">Product breakdown</p>
//                     <h3 className="mt-1 text-xl font-black text-[#052e1a]">Items sold</h3>
//                   </div>
//                   <ReceiptText className="text-[#087443]" />
//                 </div>

//                 {Array.isArray(selectedGojo.products) && selectedGojo.products.length > 0 ? (
//                   <div className="mt-4 space-y-2">
//                     {selectedGojo.products.map((product: any) => (
//                       <div key={`${product.name}-${product.category || "product"}`} className="flex items-center justify-between gap-4 rounded-2xl bg-[#f5f8f3] p-4">
//                         <div>
//                           <p className="font-black text-[#052e1a]">{product.name}</p>
//                           <p className="mt-0.5 text-xs font-semibold text-[#064e2b]/55">{product.category || "Product"} · Quantity {formatNumber(product.quantity)}</p>
//                         </div>
//                         <p className="shrink-0 font-black text-[#087443]">{formatMoney(product.total)}</p>
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <div className="mt-4 rounded-2xl bg-slate-100 p-5 text-center">
//                     <p className="font-black text-slate-600">No product orders in this period</p>
//                     <p className="mt-1 text-sm font-semibold text-slate-500">This Gojo may only have seat revenue.</p>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </main>
//   );
// }



"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TopNav } from "@/components/TopNav";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Coffee,
  Home,
  KeyRound,
  Loader2,
  Package,
  Pencil,
  Plus,
  ReceiptText,
  RefreshCw,
  Save,
  Search,
  Tag,
  TrendingUp,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";

type Summary = {
  byGojo: any[];
  productTotals: any[];
  totals: any;
};

type SalesRange = "today" | "week" | "month" | "three_months" | "all";

type Product = {
  id: string;
  name: string;
  category: string;
  price: string | number;
  unit: string;
};

type ProductForm = {
  id: string;
  name: string;
  category: string;
  price: string;
  unit: string;
};

type StaffAccount = {
  id: string;
  username: string;
  createdAt: string;
  updatedAt: string;
};

type StaffForm = {
  id: string;
  username: string;
  password: string;
  confirmPassword: string;
};

const EMPTY_PRODUCT_FORM: ProductForm = {
  id: "",
  name: "",
  category: "",
  price: "",
  unit: "item",
};

const EMPTY_STAFF_FORM: StaffForm = {
  id: "",
  username: "",
  password: "",
  confirmPassword: "",
};

const SALES_RANGES: Array<{
  value: SalesRange;
  label: string;
  shortLabel: string;
}> = [
  { value: "today", label: "Today", shortLabel: "Today" },
  { value: "week", label: "This week", shortLabel: "Week" },
  { value: "month", label: "This month", shortLabel: "Month" },
  { value: "three_months", label: "Last 3 months", shortLabel: "3 months" },
  { value: "all", label: "All time", shortLabel: "All time" },
];

type Notice = {
  type: "success" | "error" | "info";
  text: string;
};

async function readJsonSafe(url: string, signal?: AbortSignal) {
  const res = await fetch(url, {
    cache: "no-store",
    signal,
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
  const [salesRange, setSalesRange] = useState<SalesRange>("today");
  const [selectedGojo, setSelectedGojo] = useState<any | null>(null);
  const [productManagerOpen, setProductManagerOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSaving, setProductSaving] = useState(false);
  const [productDeleting, setProductDeleting] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [productForm, setProductForm] = useState<ProductForm>(EMPTY_PRODUCT_FORM);
  const [staffManagerOpen, setStaffManagerOpen] = useState(false);
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffDeleting, setStaffDeleting] = useState(false);
  const [staffSearch, setStaffSearch] = useState("");
  const [staffForm, setStaffForm] = useState<StaffForm>(EMPTY_STAFF_FORM);

  const loadingRef = useRef(false);
  const activeControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  async function load(
    manual = false,
    range: SalesRange = salesRange,
    signal?: AbortSignal,
  ) {
    if (loadingRef.current) return;

    const requestId = ++requestIdRef.current;
    loadingRef.current = true;

    try {
      if (manual) setRefreshing(true);
      setNotice(null);

      const data = await readJsonSafe(
        `/api/summary?range=${range}`,
        signal,
      );

      if (signal?.aborted || requestId !== requestIdRef.current) return;

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
          text: `${SALES_RANGES.find((item) => item.value === range)?.label || "Selected period"} refreshed successfully.`,
        });
      }
    } catch (error: any) {
      if (
        signal?.aborted ||
        error?.name === "AbortError" ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      console.error("Failed to load admin dashboard:", error);

      setNotice({
        type: "error",
        text:
          error?.message ||
          "Failed to load admin dashboard. Please refresh again.",
      });
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
        loadingRef.current = false;
      }
    }
  }

  async function loadProducts() {
    setProductsLoading(true);

    try {
      /*
       * Reuse the same endpoint that already powers the customer menu.
       * It returns the existing Gojo and product records.
       */
      const data = await readJsonSafe("/api/bootstrap");

      const existingProducts: Product[] = Array.isArray(data.products)
        ? data.products.map((product: any) => ({
            id: String(product.id || ""),
            name: String(product.name || ""),
            category: String(product.category || ""),
            price: product.price ?? 0,
            unit: String(product.unit || "item"),
          }))
        : [];

      setProducts(existingProducts);
    } catch (error: any) {
      console.error("Failed to load products:", error);

      setNotice({
        type: "error",
        text: error?.message || "Failed to load products.",
      });
    } finally {
      setProductsLoading(false);
    }
  }

  async function openProductManager() {
    setProductManagerOpen(true);
    setProductForm(EMPTY_PRODUCT_FORM);
    await loadProducts();
  }

  function selectProduct(product: Product) {
    setProductForm({
      id: product.id,
      name: product.name || "",
      category: product.category || "",
      price: String(product.price ?? ""),
      unit: product.unit || "item",
    });
  }

  function startNewProduct() {
    setProductForm(EMPTY_PRODUCT_FORM);
  }

  async function deleteProduct() {
    if (!productForm.id) return;

    const productName = productForm.name.trim() || "this product";

    const confirmed = window.confirm(
      `Delete ${productName}? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setProductDeleting(true);

    try {
      const res = await fetch(`/api/products/${productForm.id}`, {
        method: "DELETE",
      });

      const text = await res.text();
      let data: any = {};

      if (text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          data = {};
        }
      }

      if (!res.ok) {
        throw new Error(
          data?.error || text || `Failed to delete product (${res.status}).`,
        );
      }

      setNotice({
        type: "success",
        text: `${productName} deleted successfully.`,
      });

      setProductForm(EMPTY_PRODUCT_FORM);
      await loadProducts();
    } catch (error: any) {
      console.error("Failed to delete product:", error);
      setNotice({
        type: "error",
        text: error?.message || "Failed to delete product.",
      });
    } finally {
      setProductDeleting(false);
    }
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = productForm.name.trim();
    const category = productForm.category.trim();
    const unit = productForm.unit.trim();
    const price = Number(productForm.price);

    if (!name || !category || !unit) {
      setNotice({ type: "error", text: "Name, category, and unit are required." });
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setNotice({ type: "error", text: "Enter a valid product price." });
      return;
    }

    setProductSaving(true);

    try {
      const isEditing = Boolean(productForm.id);

      const res = await fetch(
        isEditing
          ? `/api/products/${productForm.id}`
          : "/api/products",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            category,
            price,
            unit,
          }),
        },
      );

      const text = await res.text();

      let data: any = {};

      if (text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          data = {};
        }
      }

      if (!res.ok) {
        throw new Error(
          data?.error ||
            text ||
            `Failed to save product (${res.status}).`,
        );
      }

      setNotice({
        type: "success",
        text: productForm.id
          ? `${name} updated successfully.`
          : `${name} added successfully.`,
      });

      await loadProducts();

      if (data.product) {
        selectProduct(data.product);
      } else {
        setProductForm(EMPTY_PRODUCT_FORM);
      }
    } catch (error: any) {
      console.error("Failed to save product:", error);
      setNotice({
        type: "error",
        text: error?.message || "Failed to save product.",
      });
    } finally {
      setProductSaving(false);
    }
  }

  async function loadStaffAccounts() {
    setStaffLoading(true);

    try {
      const data = await readJsonSafe("/api/admin/staff-accounts");

      setStaffAccounts(
        Array.isArray(data.staff)
          ? data.staff.map((account: any) => ({
              id: String(account.id || ""),
              username: String(account.username || ""),
              createdAt: String(account.createdAt || ""),
              updatedAt: String(account.updatedAt || ""),
            }))
          : [],
      );
    } catch (error: any) {
      console.error("Failed to load staff accounts:", error);

      setNotice({
        type: "error",
        text: error?.message || "Failed to load staff accounts.",
      });
    } finally {
      setStaffLoading(false);
    }
  }

  async function openStaffManager() {
    setStaffManagerOpen(true);
    setStaffForm(EMPTY_STAFF_FORM);
    setStaffSearch("");
    await loadStaffAccounts();
  }

  function selectStaff(account: StaffAccount) {
    setStaffForm({
      id: account.id,
      username: account.username,
      password: "",
      confirmPassword: "",
    });
  }

  function startNewStaff() {
    setStaffForm(EMPTY_STAFF_FORM);
  }

  async function saveStaff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const username = staffForm.username.trim();
    const isEditing = Boolean(staffForm.id);

    if (!username) {
      setNotice({
        type: "error",
        text: "Staff username is required.",
      });
      return;
    }

    if (!isEditing && !staffForm.password) {
      setNotice({
        type: "error",
        text: "A password is required for a new staff account.",
      });
      return;
    }

    if (staffForm.password && staffForm.password.length < 8) {
      setNotice({
        type: "error",
        text: "Staff password must be at least 8 characters.",
      });
      return;
    }

    if (staffForm.password !== staffForm.confirmPassword) {
      setNotice({
        type: "error",
        text: "The passwords do not match.",
      });
      return;
    }

    setStaffSaving(true);

    try {
      const response = await fetch("/api/admin/staff-accounts", {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: staffForm.id || undefined,
          username,
          password: staffForm.password || undefined,
        }),
      });

      const responseText = await response.text();

      let data: any = {};

      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = {};
        }
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            responseText ||
            `Failed to save staff account (${response.status}).`,
        );
      }

      setNotice({
        type: "success",
        text: isEditing
          ? `${username} updated successfully.`
          : `${username} created successfully.`,
      });

      await loadStaffAccounts();

      if (data.staff) {
        selectStaff(data.staff);
      } else {
        setStaffForm(EMPTY_STAFF_FORM);
      }
    } catch (error: any) {
      console.error("Failed to save staff account:", error);

      setNotice({
        type: "error",
        text: error?.message || "Failed to save staff account.",
      });
    } finally {
      setStaffSaving(false);
    }
  }

  async function deleteStaff() {
    if (!staffForm.id) return;

    const username = staffForm.username.trim() || "this staff account";

    const confirmed = window.confirm(
      `Delete ${username}? This staff member will no longer be able to log in.`,
    );

    if (!confirmed) return;

    setStaffDeleting(true);

    try {
      const response = await fetch("/api/admin/staff-accounts", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: staffForm.id,
        }),
      });

      const responseText = await response.text();

      let data: any = {};

      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = {};
        }
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            responseText ||
            `Failed to delete staff account (${response.status}).`,
        );
      }

      setNotice({
        type: "success",
        text: `${username} deleted successfully.`,
      });

      setStaffForm(EMPTY_STAFF_FORM);
      await loadStaffAccounts();
    } catch (error: any) {
      console.error("Failed to delete staff account:", error);

      setNotice({
        type: "error",
        text: error?.message || "Failed to delete staff account.",
      });
    } finally {
      setStaffDeleting(false);
    }
  }

  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    activeControllerRef.current?.abort();
    const controller = new AbortController();
    activeControllerRef.current = controller;

    // Allow a new range request to start immediately.
    loadingRef.current = false;
    setLoading(true);

    const poll = async () => {
      if (disposed || controller.signal.aborted) return;

      await load(false, salesRange, controller.signal);

      if (!disposed && !controller.signal.aborted) {
        timer = setTimeout(poll, 5000);
      }
    };

    void poll();

    return () => {
      disposed = true;
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [salesRange]);

  useEffect(() => {
    if (!selectedGojo && !productManagerOpen && !staffManagerOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedGojo(null);
        setProductManagerOpen(false);
        setStaffManagerOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedGojo, productManagerOpen, staffManagerOpen]);

  const activeGojos = useMemo(() => {
    return (
      summary?.byGojo?.filter((row) => Number(row.grandTotal || 0) > 0) || []
    );
  }, [summary]);

  const topGojo = useMemo(() => {
    const rows = summary?.byGojo || [];

    if (!rows.length) return null;

    return [...rows].sort(
      (a, b) => Number(b.grandTotal || 0) - Number(a.grandTotal || 0),
    )[0];
  }, [summary]);

  const totalPeople = useMemo(() => {
    return (
      summary?.byGojo?.reduce(
        (sum, row) => sum + Number(row.peopleCount || 0),
        0,
      ) || 0
    );
  }, [summary]);

  const totalQuantity = useMemo(() => {
    return (
      summary?.productTotals?.reduce(
        (sum, product) => sum + Number(product.quantity || 0),
        0,
      ) || 0
    );
  }, [summary]);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();

    if (!query) return products;

    return products.filter((product) =>
      [product.name, product.category, product.unit]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [products, productSearch]);

  const filteredStaffAccounts = useMemo(() => {
    const query = staffSearch.trim().toLowerCase();

    if (!query) return staffAccounts;

    return staffAccounts.filter((account) =>
      account.username.toLowerCase().includes(query),
    );
  }, [staffAccounts, staffSearch]);

  const selectedRangeLabel =
    SALES_RANGES.find((item) => item.value === salesRange)?.label ||
    "Selected period";

  const orderTotal = Number(summary?.totals?.orderTotal || 0);
  const seatTotal = Number(summary?.totals?.seatTotal || 0);
  const grandTotal = Number(summary?.totals?.grandTotal || 0);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(215,169,52,0.14),transparent_34%),linear-gradient(135deg,#f5f7ef,#e8f5ec_45%,#f7f3df)] pb-10">
    {/* <TopNav
  title="የአስተዳዳሪ ገጽ"
  role="admin"
/> */}

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
                  Ambo Menafesha daily dashboard
                </h1>

                <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/70 sm:text-base">
                  Monitor each gojo/home, product sales, seat charges, and
                  payment totals for the selected sales period.
                </p>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur sm:min-w-[330px]">
                <p className="text-sm font-bold text-white/60">
                  {selectedRangeLabel} grand total
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
              {selectedRangeLabel} totals
            </h2>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={openStaffManager}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#064e2b]/15 bg-white px-5 py-3 font-black text-[#064e2b] shadow-sm transition hover:bg-[#eef7f0] sm:w-auto"
            >
              <Users size={18} />
              Manage Staff
            </button>

            <button
              type="button"
              onClick={openProductManager}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#064e2b]/15 bg-white px-5 py-3 font-black text-[#064e2b] shadow-sm transition hover:bg-[#eef7f0] sm:w-auto"
            >
              <Package size={18} />
              Manage Products
            </button>

            <button
              type="button"
              onClick={() => load(true, salesRange)}
              disabled={refreshing || loading}
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
        </div>

        <div className="mb-6 rounded-[2rem] border border-[#064e2b]/10 bg-white/90 p-3 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3 px-2">
              <div className="rounded-2xl bg-[#064e2b]/8 p-3 text-[#064e2b]">
                <CalendarDays size={21} />
              </div>
              <div>
                <p className="text-sm font-black text-[#052e1a]">
                  Sales period
                </p>
                <p className="text-xs font-semibold text-[#064e2b]/55">
                  Every total and table follows this selection
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {SALES_RANGES.map((range) => {
                const active = salesRange === range.value;

                return (
                  <button
                    key={range.value}
                    type="button"
                    onClick={() => setSalesRange(range.value)}
                    className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                      active
                        ? "bg-[#052e1a] text-[#f5d36a] shadow-lg"
                        : "border border-[#064e2b]/10 bg-[#f5f8f3] text-[#064e2b] hover:bg-[#eaf4ed]"
                    }`}
                  >
                    {range.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>
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
                    Full payment for {selectedRangeLabel.toLowerCase()}
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
                <p className="mt-1 text-xs font-semibold text-[#064e2b]/55">
                  Click any row to view the complete breakdown
                </p>
              </div>

              <div className="rounded-2xl bg-[#064e2b]/8 px-4 py-3 text-sm font-black text-[#064e2b]">
                {activeGojos.length} active gojo
                {activeGojos.length === 1 ? "" : "s"}
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
                          tabIndex={0}
                          role="button"
                          onClick={() => setSelectedGojo(row)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedGojo(row);
                            }
                          }}
                          className={`cursor-pointer border-t outline-none transition focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#087443] ${
                            Number(row.grandTotal || 0) > 0
                              ? "border-emerald-200/70 bg-emerald-50/70 hover:bg-emerald-100/70"
                              : "border-slate-200 bg-slate-100/80 text-slate-500 hover:bg-slate-200/80"
                          }`}
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

                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${
                                  Number(row.grandTotal || 0) > 0
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-300 text-slate-700"
                                }`}
                              >
                                {Number(row.grandTotal || 0) > 0
                                  ? "Payment"
                                  : "No payment"}
                              </span>
                              <span
                                className={`font-black ${
                                  Number(row.grandTotal || 0) > 0
                                    ? "text-emerald-800"
                                    : "text-slate-500"
                                }`}
                              >
                                {formatMoney(row.grandTotal)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 p-5 lg:hidden">
                  {summary?.byGojo?.map((row) => (
                    <button
                      key={row.gojo.id}
                      type="button"
                      onClick={() => setSelectedGojo(row)}
                      className={`w-full rounded-[1.5rem] border p-4 text-left transition active:scale-[0.99] ${
                        Number(row.grandTotal || 0) > 0
                          ? "border-emerald-200 bg-emerald-50/80"
                          : "border-slate-200 bg-slate-100/90"
                      }`}
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

                        <div className="text-right">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                              Number(row.grandTotal || 0) > 0
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-300 text-slate-700"
                            }`}
                          >
                            {Number(row.grandTotal || 0) > 0
                              ? "Payment"
                              : "No payment"}
                          </span>
                          <p
                            className={`mt-1 font-black ${
                              Number(row.grandTotal || 0) > 0
                                ? "text-emerald-800"
                                : "text-slate-500"
                            }`}
                          >
                            {formatMoney(row.grandTotal)}
                          </p>
                        </div>
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
                    </button>
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
                    Highest total payment for {selectedRangeLabel.toLowerCase()}
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

      {staffManagerOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#02180d]/70 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setStaffManagerOpen(false);
            }
          }}
        >
          <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-white/20 bg-[#f6f9f3] shadow-2xl sm:rounded-[2.5rem]">
            <div className="flex items-center justify-between gap-4 border-b border-[#064e2b]/10 bg-white px-5 py-4 sm:px-7">
              <div>
                <p className="text-xs font-black uppercase tracking-[.2em] text-[#087443]">
                  Access control
                </p>
                <h2 className="mt-1 text-2xl font-black text-[#052e1a]">
                  Staff Management
                </h2>
                <p className="mt-1 text-sm font-semibold text-[#064e2b]/55">
                  Create staff, edit usernames, reset passwords, or remove access.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStaffManagerOpen(false)}
                className="rounded-2xl bg-[#064e2b]/8 p-3 text-[#064e2b] transition hover:bg-[#064e2b]/15"
                aria-label="Close staff manager"
              >
                <X size={22} />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[360px_1fr]">
              <aside className="flex min-h-0 flex-col border-b border-[#064e2b]/10 bg-white p-4 lg:border-b-0 lg:border-r lg:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[.18em] text-[#087443]">
                      Staff accounts
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#064e2b]/55">
                      {staffAccounts.length} account
                      {staffAccounts.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={startNewStaff}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#052e1a] px-4 py-3 text-sm font-black text-white transition hover:bg-[#064e2b]"
                  >
                    <UserPlus size={17} />
                    New
                  </button>
                </div>

                <div className="relative mt-4">
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#064e2b]/40"
                  />
                  <input
                    value={staffSearch}
                    onChange={(event) => setStaffSearch(event.target.value)}
                    placeholder="Search staff..."
                    className="w-full rounded-2xl border border-[#064e2b]/12 bg-[#f7fbf2] py-3 pl-11 pr-4 font-semibold text-[#052e1a] outline-none focus:border-[#087443] focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto">
                  {staffLoading ? (
                    <div className="flex items-center justify-center rounded-2xl bg-[#f5f8f3] p-8">
                      <Loader2 className="animate-spin text-[#087443]" size={26} />
                    </div>
                  ) : filteredStaffAccounts.length ? (
                    filteredStaffAccounts.map((account) => {
                      const selected = staffForm.id === account.id;

                      return (
                        <button
                          key={account.id}
                          type="button"
                          onClick={() => selectStaff(account)}
                          className={`w-full rounded-2xl border p-4 text-left transition ${
                            selected
                              ? "border-[#087443] bg-emerald-50 shadow-sm"
                              : "border-[#064e2b]/8 bg-white hover:border-[#087443]/35 hover:bg-[#f7fbf2]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-black text-[#052e1a]">
                                {account.username}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-[#064e2b]/50">
                                Updated{" "}
                                {account.updatedAt
                                  ? new Date(account.updatedAt).toLocaleDateString()
                                  : "recently"}
                              </p>
                            </div>

                            <Users
                              size={19}
                              className={
                                selected
                                  ? "text-[#087443]"
                                  : "text-[#064e2b]/35"
                              }
                            />
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl bg-slate-100 p-6 text-center">
                      <p className="font-black text-slate-600">
                        No staff accounts found
                      </p>
                    </div>
                  )}
                </div>
              </aside>

              <section className="min-h-0 overflow-y-auto p-4 sm:p-6">
                <div className="rounded-[1.75rem] bg-[#052e1a] p-5 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[.18em] text-[#f5d36a]">
                        {staffForm.id ? "Edit account" : "Create account"}
                      </p>
                      <h3 className="mt-2 text-2xl font-black">
                        {staffForm.id
                          ? staffForm.username || "Selected staff"
                          : "New staff member"}
                      </h3>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-3 text-[#f5d36a]">
                      {staffForm.id ? (
                        <Pencil size={23} />
                      ) : (
                        <UserPlus size={23} />
                      )}
                    </div>
                  </div>
                </div>

                <form onSubmit={saveStaff} className="mt-5 space-y-4">
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#052e1a]">
                      <Users size={16} />
                      Staff username
                    </span>
                    <input
                      value={staffForm.username}
                      onChange={(event) =>
                        setStaffForm((current) => ({
                          ...current,
                          username: event.target.value,
                        }))
                      }
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="Example: staff1"
                      className="w-full rounded-2xl border border-[#064e2b]/12 bg-white px-4 py-3.5 font-semibold text-[#052e1a] outline-none transition focus:border-[#087443] focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#052e1a]">
                        <KeyRound size={16} />
                        {staffForm.id ? "New password" : "Password"}
                      </span>
                      <input
                        type="password"
                        value={staffForm.password}
                        onChange={(event) =>
                          setStaffForm((current) => ({
                            ...current,
                            password: event.target.value,
                          }))
                        }
                        autoComplete="new-password"
                        placeholder={
                          staffForm.id
                            ? "Leave blank to keep current"
                            : "Minimum 8 characters"
                        }
                        className="w-full rounded-2xl border border-[#064e2b]/12 bg-white px-4 py-3.5 font-semibold text-[#052e1a] outline-none transition focus:border-[#087443] focus:ring-4 focus:ring-emerald-100"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#052e1a]">
                        <KeyRound size={16} />
                        Confirm password
                      </span>
                      <input
                        type="password"
                        value={staffForm.confirmPassword}
                        onChange={(event) =>
                          setStaffForm((current) => ({
                            ...current,
                            confirmPassword: event.target.value,
                          }))
                        }
                        autoComplete="new-password"
                        placeholder="Repeat password"
                        className="w-full rounded-2xl border border-[#064e2b]/12 bg-white px-4 py-3.5 font-semibold text-[#052e1a] outline-none transition focus:border-[#087443] focus:ring-4 focus:ring-emerald-100"
                      />
                    </label>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                    Passwords are securely hashed, so the old password cannot be viewed or resent. Set a new password to restore access.
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {staffForm.id && (
                      <button
                        type="button"
                        onClick={deleteStaff}
                        disabled={staffSaving || staffDeleting}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {staffDeleting ? (
                          <>
                            <Loader2 size={19} className="animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 size={19} />
                            Delete Staff
                          </>
                        )}
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={staffSaving || staffDeleting}
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#087443] px-5 py-4 font-black text-white shadow-xl transition hover:bg-[#06663a] disabled:cursor-not-allowed disabled:opacity-60 ${
                        staffForm.id ? "" : "sm:col-span-2"
                      }`}
                    >
                      {staffSaving ? (
                        <>
                          <Loader2 size={19} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={19} />
                          {staffForm.id
                            ? "Save / Reset Password"
                            : "Create Staff"}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          </div>
        </div>
      )}

      {productManagerOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#02180d]/70 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setProductManagerOpen(false);
            }
          }}
        >
          <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-white/20 bg-[#f6f9f3] shadow-2xl sm:rounded-[2.5rem]">
            <div className="flex items-center justify-between gap-4 border-b border-[#064e2b]/10 bg-white px-5 py-4 sm:px-7">
              <div>
                <p className="text-xs font-black uppercase tracking-[.2em] text-[#087443]">
                  Menu control
                </p>
                <h2 className="mt-1 text-2xl font-black text-[#052e1a]">
                  Product Management
                </h2>
                <p className="mt-1 text-sm font-semibold text-[#064e2b]/55">
                  Add a product or click an existing product to edit it.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setProductManagerOpen(false)}
                className="rounded-2xl bg-[#064e2b]/8 p-3 text-[#064e2b] transition hover:bg-[#064e2b]/15"
                aria-label="Close product manager"
              >
                <X size={22} />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[1.05fr_.95fr] lg:overflow-hidden">
              <section className="border-b border-[#064e2b]/10 p-4 sm:p-6 lg:overflow-y-auto lg:border-b-0 lg:border-r">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <label className="relative flex-1">
                    <Search
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#064e2b]/45"
                    />
                    <input
                      value={productSearch}
                      onChange={(event) => setProductSearch(event.target.value)}
                      placeholder="Search products..."
                      className="w-full rounded-2xl border border-[#064e2b]/12 bg-white py-3 pl-11 pr-4 font-semibold text-[#052e1a] outline-none transition focus:border-[#087443] focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={startNewProduct}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#052e1a] px-5 py-3 font-black text-[#f5d36a] shadow-lg transition hover:bg-[#064e2b]"
                  >
                    <Plus size={18} />
                    New Product
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {productsLoading &&
                    [1, 2, 3, 4].map((item) => (
                      <div
                        key={item}
                        className="h-20 animate-pulse rounded-2xl bg-[#064e2b]/8"
                      />
                    ))}

                  {!productsLoading &&
                    filteredProducts.map((product) => {
                      const selected = productForm.id === product.id;

                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => selectProduct(product)}
                          className={`flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition ${
                            selected
                              ? "border-[#087443] bg-emerald-50 shadow-md ring-2 ring-emerald-100"
                              : "border-[#064e2b]/10 bg-white hover:border-[#087443]/35 hover:bg-[#f4faf5]"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-black text-[#052e1a]">
                                {product.name}
                              </p>
                              {selected && (
                                <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
                                  Editing
                                </span>
                              )}
                            </div>
                            <p className="mt-1 truncate text-sm font-semibold text-[#064e2b]/55">
                              {product.category} · per {product.unit}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-3">
                            <p className="font-black text-[#087443]">
                              {formatMoney(product.price)}
                            </p>
                            <Pencil size={17} className="text-[#064e2b]/45" />
                          </div>
                        </button>
                      );
                    })}

                  {!productsLoading && !filteredProducts.length && (
                    <div className="rounded-[1.5rem] border border-dashed border-[#064e2b]/20 bg-white p-8 text-center">
                      <Package size={30} className="mx-auto text-[#064e2b]/35" />
                      <p className="mt-3 font-black text-[#052e1a]">
                        No products found
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#064e2b]/50">
                        Clear the search or create a new product.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <section className="p-4 sm:p-6 lg:overflow-y-auto">
                <div className="rounded-[1.75rem] bg-[#052e1a] p-5 text-white shadow-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[.2em] text-[#f5d36a]">
                        {productForm.id ? "Edit product" : "Add product"}
                      </p>
                      <h3 className="mt-2 text-2xl font-black">
                        {productForm.id
                          ? productForm.name || "Selected product"
                          : "Create menu item"}
                      </h3>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3 text-[#f5d36a]">
                      {productForm.id ? <Pencil size={23} /> : <Plus size={23} />}
                    </div>
                  </div>
                </div>

                <form onSubmit={saveProduct} className="mt-5 space-y-4">
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#052e1a]">
                      <Package size={16} /> Product name
                    </span>
                    <input
                      value={productForm.name}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Example: Buna"
                      className="w-full rounded-2xl border border-[#064e2b]/12 bg-white px-4 py-3.5 font-semibold text-[#052e1a] outline-none transition focus:border-[#087443] focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#052e1a]">
                      <Tag size={16} /> Category
                    </span>
                    <input
                      value={productForm.category}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          category: event.target.value,
                        }))
                      }
                      placeholder="Example: Hot drinks"
                      className="w-full rounded-2xl border border-[#064e2b]/12 bg-white px-4 py-3.5 font-semibold text-[#052e1a] outline-none transition focus:border-[#087443] focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#052e1a]">
                        <CircleDollarSign size={16} /> Price (ETB)
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={productForm.price}
                        onChange={(event) =>
                          setProductForm((current) => ({
                            ...current,
                            price: event.target.value,
                          }))
                        }
                        placeholder="0"
                        className="w-full rounded-2xl border border-[#064e2b]/12 bg-white px-4 py-3.5 font-semibold text-[#052e1a] outline-none transition focus:border-[#087443] focus:ring-4 focus:ring-emerald-100"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#052e1a]">
                        <Tag size={16} /> Unit
                      </span>
                      <input
                        value={productForm.unit}
                        onChange={(event) =>
                          setProductForm((current) => ({
                            ...current,
                            unit: event.target.value,
                          }))
                        }
                        placeholder="cup, bottle, plate..."
                        className="w-full rounded-2xl border border-[#064e2b]/12 bg-white px-4 py-3.5 font-semibold text-[#052e1a] outline-none transition focus:border-[#087443] focus:ring-4 focus:ring-emerald-100"
                      />
                    </label>
                  </div>

                  <div className="rounded-2xl border border-[#064e2b]/10 bg-white p-4 text-sm font-semibold text-[#064e2b]/65">
                    Saved changes are returned by the products API and will be available to the customer menu on its next refresh.
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {productForm.id && (
                      <button
                        type="button"
                        onClick={deleteProduct}
                        disabled={productSaving || productDeleting}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {productDeleting ? (
                          <>
                            <Loader2 size={19} className="animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 size={19} />
                            Delete Product
                          </>
                        )}
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={productSaving || productDeleting}
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#087443] px-5 py-4 font-black text-white shadow-xl transition hover:bg-[#06663a] disabled:cursor-not-allowed disabled:opacity-60 ${
                        productForm.id ? "" : "sm:col-span-2"
                      }`}
                    >
                      {productSaving ? (
                        <>
                          <Loader2 size={19} className="animate-spin" />
                          Saving product...
                        </>
                      ) : (
                        <>
                          <Save size={19} />
                          {productForm.id ? "Save Changes" : "Add Product"}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          </div>
        </div>
      )}

      {selectedGojo && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-[#02170d]/65 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedGojo(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="gojo-detail-title"
            className="max-h-[92vh] w-full overflow-hidden rounded-t-[2rem] bg-[#f7fbf2] shadow-2xl sm:max-w-3xl sm:rounded-[2rem]"
          >
            <div className="flex items-start justify-between gap-4 bg-[#052e1a] p-5 text-white sm:p-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[.22em] text-[#f5d36a]">
                  {selectedRangeLabel} details
                </p>
                <h2 id="gojo-detail-title" className="mt-2 text-2xl font-black sm:text-3xl">
                  {selectedGojo.gojo?.name || "Gojo/Home"}
                </h2>
                <p className="mt-1 text-sm font-semibold text-white/60">
                  Full sales and seating breakdown
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedGojo(null)}
                className="rounded-2xl bg-white/10 p-3 text-white transition hover:bg-white/20"
                aria-label="Close details"
              >
                <X size={22} />
              </button>
            </div>

            <div className="max-h-[calc(92vh-120px)] overflow-y-auto p-4 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-[1.5rem] border border-[#064e2b]/10 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-[#064e2b]/50">People</p>
                  <p className="mt-2 text-2xl font-black text-[#052e1a]">{formatNumber(selectedGojo.peopleCount)}</p>
                </div>
                <div className="rounded-[1.5rem] border border-[#064e2b]/10 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-[#064e2b]/50">Average seat price</p>
                  <p className="mt-2 text-2xl font-black text-[#052e1a]">{formatMoney(selectedGojo.seatPrice)}</p>
                </div>
                <div className="rounded-[1.5rem] border border-[#064e2b]/10 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-[#064e2b]/50">Order sales</p>
                  <p className="mt-2 text-2xl font-black text-[#052e1a]">{formatMoney(selectedGojo.orderTotal)}</p>
                </div>
                <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-emerald-700/60">Grand total</p>
                  <p className="mt-2 text-2xl font-black text-emerald-800">{formatMoney(selectedGojo.grandTotal)}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-[#064e2b]/10 bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[.18em] text-[#087443]">Seat calculation</p>
                      <h3 className="mt-1 text-lg font-black text-[#052e1a]">Seating revenue</h3>
                    </div>
                    <Users className="text-[#087443]" />
                  </div>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-4"><span className="font-semibold text-[#064e2b]/60">People count</span><strong className="text-[#052e1a]">{formatNumber(selectedGojo.peopleCount)}</strong></div>
                    <div className="flex justify-between gap-4"><span className="font-semibold text-[#064e2b]/60">Average seat price</span><strong className="text-[#052e1a]">{formatMoney(selectedGojo.seatPrice)}</strong></div>
                    <div className="border-t border-[#064e2b]/10 pt-3 flex justify-between gap-4"><span className="font-black text-[#052e1a]">Seat total</span><strong className="text-[#087443]">{formatMoney(selectedGojo.seatTotal)}</strong></div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-[#064e2b]/10 bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[.18em] text-[#087443]">Payment status</p>
                      <h3 className="mt-1 text-lg font-black text-[#052e1a]">Period result</h3>
                    </div>
                    <CircleDollarSign className="text-[#087443]" />
                  </div>
                  <div className={`mt-4 rounded-2xl p-4 ${Number(selectedGojo.grandTotal || 0) > 0 ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                    <p className="text-xs font-black uppercase tracking-wide">{Number(selectedGojo.grandTotal || 0) > 0 ? "Payment recorded" : "No payment"}</p>
                    <p className="mt-1 text-2xl font-black">{formatMoney(selectedGojo.grandTotal)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-[#064e2b]/10 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[.18em] text-[#087443]">Product breakdown</p>
                    <h3 className="mt-1 text-xl font-black text-[#052e1a]">Items sold</h3>
                  </div>
                  <ReceiptText className="text-[#087443]" />
                </div>

                {Array.isArray(selectedGojo.products) && selectedGojo.products.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {selectedGojo.products.map((product: any) => (
                      <div key={`${product.name}-${product.category || "product"}`} className="flex items-center justify-between gap-4 rounded-2xl bg-[#f5f8f3] p-4">
                        <div>
                          <p className="font-black text-[#052e1a]">{product.name}</p>
                          <p className="mt-0.5 text-xs font-semibold text-[#064e2b]/55">{product.category || "Product"} · Quantity {formatNumber(product.quantity)}</p>
                        </div>
                        <p className="shrink-0 font-black text-[#087443]">{formatMoney(product.total)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl bg-slate-100 p-5 text-center">
                    <p className="font-black text-slate-600">No product orders in this period</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">This Gojo may only have seat revenue.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
