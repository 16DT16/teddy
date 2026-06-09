import {
  NextRequest,
  NextResponse,
} from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SummaryRange =
  | "today"
  | "week"
  | "month"
  | "three_months"
  | "all";

type ProductSummary = {
  name: string;
  category: string | null;
  quantity: number;
  total: number;
};

const ADDIS_ABABA_OFFSET_MS =
  3 * 60 * 60 * 1000;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

function getAddisDateParts(
  date = new Date(),
) {
  const shiftedDate = new Date(
    date.getTime() +
      ADDIS_ABABA_OFFSET_MS,
  );

  return {
    year: shiftedDate.getUTCFullYear(),
    month: shiftedDate.getUTCMonth(),
    day: shiftedDate.getUTCDate(),
    weekday: shiftedDate.getUTCDay(),
  };
}

function createBusinessDate(
  year: number,
  month: number,
  day: number,
) {
  /*
   * Business dates are stored as UTC calendar dates.
   * Addis time is used to determine the current
   * business day.
   */
  return new Date(
    Date.UTC(
      year,
      month,
      day,
      0,
      0,
      0,
      0,
    ),
  );
}

function getTodayBusinessDate() {
  const {
    year,
    month,
    day,
  } = getAddisDateParts();

  return createBusinessDate(
    year,
    month,
    day,
  );
}

function getStartDate(
  range: SummaryRange,
): Date | null {
  const {
    year,
    month,
    day,
    weekday,
  } = getAddisDateParts();

  if (range === "all") {
    return null;
  }

  if (range === "today") {
    return createBusinessDate(
      year,
      month,
      day,
    );
  }

  if (range === "week") {
    /*
     * Monday is the first day
     * of the business week.
     */
    const daysSinceMonday =
      weekday === 0
        ? 6
        : weekday - 1;

    return createBusinessDate(
      year,
      month,
      day - daysSinceMonday,
    );
  }

  if (range === "month") {
    return createBusinessDate(
      year,
      month,
      1,
    );
  }

  /*
   * Current month plus the previous
   * two calendar months.
   */
  return createBusinessDate(
    year,
    month - 2,
    1,
  );
}

function getEndOfToday() {
  const {
    year,
    month,
    day,
  } = getAddisDateParts();

  return new Date(
    createBusinessDate(
      year,
      month,
      day + 1,
    ).getTime() - 1,
  );
}

function normalizeRange(
  value: string | null,
): SummaryRange {
  if (
    value === "today" ||
    value === "week" ||
    value === "month" ||
    value === "three_months" ||
    value === "all"
  ) {
    return value;
  }

  return "today";
}

function isDatabaseUnavailable(
  error: unknown,
) {
  if (
    !error ||
    typeof error !== "object"
  ) {
    return false;
  }

  const possibleError = error as {
    code?: string;
    message?: string;
  };

  if (
    possibleError.code === "P1001" ||
    possibleError.code === "P1002" ||
    possibleError.code === "P1017" ||
    possibleError.code === "P2024"
  ) {
    return true;
  }

  const message =
    possibleError.message || "";

  return (
    message.includes(
      "Can't reach database server",
    ) ||
    message.includes(
      "Server has closed the connection",
    ) ||
    message.includes(
      "connection was forcibly closed",
    ) ||
    message.includes(
      "Connection reset",
    ) ||
    message.includes(
      "Connection timed out",
    )
  );
}

function isPreparedStatementError(
  error: unknown,
) {
  if (
    !error ||
    typeof error !== "object"
  ) {
    return false;
  }

  const possibleError = error as {
    message?: string;
  };

  const message =
    possibleError.message || "";

  return (
    message.includes("42P05") ||
    message.includes(
      "prepared statement",
    )
  );
}

function databaseUnavailableResponse() {
  return NextResponse.json(
    {
      error:
        "የመረጃ ቋቱ ግንኙነት ለጊዜው ዘግይቷል። ሲስተሙ በራሱ እንደገና ይሞክራል።",
      retryable: true,
    },
    {
      status: 503,
      headers: {
        ...NO_STORE_HEADERS,
        "Retry-After": "15",
      },
    },
  );
}

export async function GET(
  request: NextRequest,
) {
  try {
    await requireRole([
      "staff",
      "admin",
    ]);
  } catch {
    return NextResponse.json(
      {
        error:
          "የመግቢያ ፍቃድዎ አልቋል። እባክዎ እንደገና ይግቡ።",
        retryable: false,
      },
      {
        status: 401,
        headers:
          NO_STORE_HEADERS,
      },
    );
  }

  try {
    const range = normalizeRange(
      request.nextUrl.searchParams.get(
        "range",
      ),
    );

    const startDate =
      getStartDate(range);

    const endDate =
      getEndOfToday();

    const todayBusinessDate =
      getTodayBusinessDate();

    const businessDateFilter =
      range === "all"
        ? {
            lte: endDate,
          }
        : {
            gte: startDate!,
            lte: endDate,
          };

    /*
     * All database requests start together.
     *
     * Previous flow:
     * 1. upsert today's session
     * 2. load sessions
     * 3. load Gojo, orders and DayGojo rows
     *
     * New flow:
     * all four read queries run concurrently.
     */
    const [
      sessions,
      gojos,
      orders,
      dayGojos,
    ] = await Promise.all([
      prisma.daySession.findMany({
        where: {
          businessDate:
            businessDateFilter,
        },

        select: {
          id: true,
          businessDate: true,
          status: true,
          defaultSeatPrice: true,
          createdAt: true,
          updatedAt: true,
        },

        orderBy: {
          businessDate: "asc",
        },
      }),

      prisma.gojo.findMany({
        where: {
          active: true,
        },

        select: {
          id: true,
          number: true,
          name: true,
          description: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },

        orderBy: {
          number: "asc",
        },
      }),

      prisma.order.findMany({
        where: {
          session: {
            businessDate:
              businessDateFilter,
          },

          status: {
            not: "CANCELLED",
          },
        },

        select: {
          id: true,
          sessionId: true,
          gojoId: true,
          productId: true,
          quantity: true,
          unitPrice: true,
          totalPrice: true,
          customerText: true,
          status: true,
          createdAt: true,
          updatedAt: true,

          gojo: {
            select: {
              id: true,
              number: true,
              name: true,
            },
          },

          product: {
            select: {
              id: true,
              name: true,
              category: true,
              price: true,
              unit: true,
            },
          },
        },

        orderBy: {
          createdAt: "asc",
        },
      }),

      prisma.dayGojo.findMany({
        where: {
          session: {
            businessDate:
              businessDateFilter,
          },
        },

        select: {
          id: true,
          sessionId: true,
          gojoId: true,
          peopleCount: true,
          seatPrice: true,
          createdAt: true,
          updatedAt: true,

          gojo: {
            select: {
              id: true,
              number: true,
              name: true,
            },
          },
        },
      }),
    ]);

    /*
     * Summary GET is now read-only.
     *
     * If today's session does not exist yet,
     * session will be null. It will be created
     * when the first order or billing record
     * actually needs it.
     */
    const todaySession =
      sessions.find(
        (session) =>
          session.businessDate.getTime() ===
          todayBusinessDate.getTime(),
      ) || null;

    const dayGojosByGojo =
      new Map<
        string,
        typeof dayGojos
      >();

    for (
      const dayGojo of dayGojos
    ) {
      const currentRows =
        dayGojosByGojo.get(
          dayGojo.gojoId,
        ) || [];

      currentRows.push(dayGojo);

      dayGojosByGojo.set(
        dayGojo.gojoId,
        currentRows,
      );
    }

    /*
     * Build an order map once.
     *
     * This avoids repeatedly filtering the complete
     * order list once for every Gojo.
     */
    const ordersByGojo =
      new Map<
        string,
        typeof orders
      >();

    for (const order of orders) {
      const currentOrders =
        ordersByGojo.get(
          order.gojoId,
        ) || [];

      currentOrders.push(order);

      ordersByGojo.set(
        order.gojoId,
        currentOrders,
      );
    }

    const byGojo = gojos.map(
      (gojo) => {
        const gojoOrders =
          ordersByGojo.get(
            gojo.id,
          ) || [];

        const gojoDayRecords =
          dayGojosByGojo.get(
            gojo.id,
          ) || [];

        const orderTotal =
          gojoOrders.reduce(
            (sum, order) =>
              sum +
              Number(
                order.totalPrice || 0,
              ),
            0,
          );

        const peopleCount =
          gojoDayRecords.reduce(
            (sum, dayRecord) =>
              sum +
              Number(
                dayRecord.peopleCount ||
                  0,
              ),
            0,
          );

        const seatTotal =
          gojoDayRecords.reduce(
            (
              sum,
              dayRecord,
            ) => {
              const dailyPeopleCount =
                Number(
                  dayRecord.peopleCount ||
                    0,
                );

              const dailySeatPrice =
                Number(
                  dayRecord.seatPrice ||
                    0,
                );

              return (
                sum +
                dailyPeopleCount *
                  dailySeatPrice
              );
            },
            0,
          );

        /*
         * For multi-day ranges this is the
         * effective weighted average seat price.
         */
        const seatPrice =
          peopleCount > 0
            ? seatTotal /
              peopleCount
            : 0;

        const productMap =
          gojoOrders.reduce<
            Record<
              string,
              ProductSummary
            >
          >(
            (
              accumulator,
              order,
            ) => {
              const key =
                order.product.name;

              if (
                !accumulator[key]
              ) {
                accumulator[key] = {
                  name: key,
                  category:
                    order.product
                      .category ??
                    null,
                  quantity: 0,
                  total: 0,
                };
              }

              accumulator[
                key
              ].quantity += Number(
                order.quantity || 0,
              );

              accumulator[
                key
              ].total += Number(
                order.totalPrice || 0,
              );

              return accumulator;
            },
            {},
          );

        return {
          gojo,
          peopleCount,
          seatPrice,
          seatTotal,
          orderTotal,
          grandTotal:
            orderTotal +
            seatTotal,
          products:
            Object.values(
              productMap,
            ),
        };
      },
    );

    const productTotalsMap =
      orders.reduce<
        Record<
          string,
          ProductSummary
        >
      >(
        (
          accumulator,
          order,
        ) => {
          const key =
            order.product.name;

          if (!accumulator[key]) {
            accumulator[key] = {
              name: key,
              category:
                order.product
                  .category ??
                null,
              quantity: 0,
              total: 0,
            };
          }

          accumulator[
            key
          ].quantity += Number(
            order.quantity || 0,
          );

          accumulator[
            key
          ].total += Number(
            order.totalPrice || 0,
          );

          return accumulator;
        },
        {},
      );

    const productTotals =
      Object.values(
        productTotalsMap,
      );

    const totals =
      byGojo.reduce(
        (
          accumulator,
          row,
        ) => {
          accumulator.orderTotal +=
            row.orderTotal;

          accumulator.seatTotal +=
            row.seatTotal;

          accumulator.grandTotal +=
            row.grandTotal;

          accumulator.peopleCount +=
            row.peopleCount;

          return accumulator;
        },
        {
          orderTotal: 0,
          seatTotal: 0,
          grandTotal: 0,
          peopleCount: 0,
        },
      );

    const totalItems =
      productTotals.reduce(
        (sum, product) =>
          sum +
          Number(
            product.quantity || 0,
          ),
        0,
      );

    return NextResponse.json(
      {
        /*
         * Kept for compatibility with the
         * existing staff/admin frontend.
         *
         * It can be null before the first
         * activity of the business day.
         */
        session:
          todaySession,

        period: {
          range,

          startDate:
            startDate?.toISOString() ||
            null,

          endDate:
            endDate.toISOString(),

          sessionCount:
            sessions.length,
        },

        byGojo,
        productTotals,

        totals: {
          ...totals,

          totalItems,

          orderCount:
            orders.length,
        },
      },
      {
        status: 200,
        headers:
          NO_STORE_HEADERS,
      },
    );
  } catch (error: unknown) {
    console.error(
      "Summary API error:",
      error,
    );

    if (
      isDatabaseUnavailable(
        error,
      )
    ) {
      return databaseUnavailableResponse();
    }

    if (
      isPreparedStatementError(
        error,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "የመረጃ ቋቱ ግንኙነት በትክክል አልተዋቀረም። እባክዎ ትንሽ ቆይተው እንደገና ይሞክሩ።",

          retryable: true,
        },
        {
          status: 503,
          headers: {
            ...NO_STORE_HEADERS,
            "Retry-After": "15",
          },
        },
      );
    }

    return NextResponse.json(
      {
        error:
          "ማጠቃለያውን መጫን አልተቻለም። እባክዎ እንደገና ይሞክሩ።",

        retryable: false,
      },
      {
        status: 500,
        headers:
          NO_STORE_HEADERS,
      },
    );
  }
}