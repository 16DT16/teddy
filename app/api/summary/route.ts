import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateTodaySession } from "@/lib/day";
import { requireRole } from "@/lib/session";

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

const ADDIS_ABABA_OFFSET_MS = 3 * 60 * 60 * 1000;

function getAddisDateParts(date = new Date()) {
  const shiftedDate = new Date(
    date.getTime() + ADDIS_ABABA_OFFSET_MS
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
  return new Date(
    Date.UTC(year, month, day, 0, 0, 0, 0),
  );
}

function getStartDate(range: SummaryRange): Date | null {
  const { year, month, day, weekday } =
    getAddisDateParts();

  if (range === "all") {
    return null;
  }

  if (range === "today") {
    return createBusinessDate(year, month, day);
  }

  if (range === "week") {
    // Monday is treated as the first day of the week.
    const daysSinceMonday =
      weekday === 0 ? 6 : weekday - 1;

    return createBusinessDate(
      year,
      month,
      day - daysSinceMonday
    );
  }

  if (range === "month") {
    return createBusinessDate(year, month, 1);
  }

  // Current month and the previous two calendar months.
  return createBusinessDate(year, month - 2, 1);
}

function getEndOfToday() {
  const { year, month, day } = getAddisDateParts();

  return new Date(
    createBusinessDate(year, month, day + 1).getTime() - 1
  );
}

function normalizeRange(
  value: string | null
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

export async function GET(request: NextRequest) {
  try {
    await requireRole(["staff", "admin"]);
  } catch {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const range = normalizeRange(
      request.nextUrl.searchParams.get("range")
    );

    /*
     * Keep the original behavior:
     * make sure today's DaySession exists.
     */
    const todaySession =
      await getOrCreateTodaySession();

    const startDate = getStartDate(range);
    const endDate = getEndOfToday();

    const sessions =
      await prisma.daySession.findMany({
        where:
          range === "all"
            ? {
                businessDate: {
                  lte: endDate,
                },
              }
            : {
                businessDate: {
                  gte: startDate!,
                  lte: endDate,
                },
              },

        orderBy: {
          businessDate: "asc",
        },
      });

    const sessionIds = sessions.map(
      (session) => session.id
    );

    const [gojos, orders, dayGojos] =
      await Promise.all([
        prisma.gojo.findMany({
          where: {
            active: true,
          },
          orderBy: {
            number: "asc",
          },
        }),

        sessionIds.length > 0
          ? prisma.order.findMany({
              where: {
                sessionId: {
                  in: sessionIds,
                },
                status: {
                  not: "CANCELLED",
                },
              },
              include: {
                gojo: true,
                product: true,
              },
              orderBy: {
                createdAt: "asc",
              },
            })
          : Promise.resolve([]),

        sessionIds.length > 0
          ? prisma.dayGojo.findMany({
              where: {
                sessionId: {
                  in: sessionIds,
                },
              },
              include: {
                gojo: true,
              },
            })
          : Promise.resolve([]),
      ]);

    /*
     * In week/month/all reports one Gojo can have
     * multiple DayGojo rows, one for each business day.
     */
    const dayGojosByGojo = new Map<
      string,
      typeof dayGojos
    >();

    for (const dayGojo of dayGojos) {
      const currentRows =
        dayGojosByGojo.get(dayGojo.gojoId) || [];

      currentRows.push(dayGojo);

      dayGojosByGojo.set(
        dayGojo.gojoId,
        currentRows
      );
    }

    const byGojo = gojos.map((gojo) => {
      const gojoOrders = orders.filter(
        (order) => order.gojoId === gojo.id
      );

      const gojoDayRecords =
        dayGojosByGojo.get(gojo.id) || [];

      const orderTotal = gojoOrders.reduce(
        (sum, order) =>
          sum + Number(order.totalPrice || 0),
        0
      );

      const peopleCount = gojoDayRecords.reduce(
        (sum, dayRecord) =>
          sum + Number(dayRecord.peopleCount || 0),
        0
      );

      /*
       * Calculate each day's seat revenue separately,
       * because seat price may be different on each day.
       */
      const seatTotal = gojoDayRecords.reduce(
        (sum, dayRecord) => {
          const dailyPeopleCount = Number(
            dayRecord.peopleCount || 0
          );

          const dailySeatPrice = Number(
            dayRecord.seatPrice || 0
          );

          return (
            sum +
            dailyPeopleCount * dailySeatPrice
          );
        },
        0
      );

      /*
       * For a multi-day range, seatPrice is the
       * effective average price per person.
       */
      const seatPrice =
        peopleCount > 0
          ? seatTotal / peopleCount
          : 0;

      const productMap =
        gojoOrders.reduce<
          Record<string, ProductSummary>
        >((accumulator, order) => {
          const key = order.product.name;

          if (!accumulator[key]) {
            accumulator[key] = {
              name: key,
              category:
                order.product.category ?? null,
              quantity: 0,
              total: 0,
            };
          }

          accumulator[key].quantity += Number(
            order.quantity || 0
          );

          accumulator[key].total += Number(
            order.totalPrice || 0
          );

          return accumulator;
        }, {});

      const products = Object.values(productMap);

      return {
        gojo,
        peopleCount,
        seatPrice,
        seatTotal,
        orderTotal,
        grandTotal: orderTotal + seatTotal,
        products,
      };
    });

    const productTotalsMap =
      orders.reduce<
        Record<string, ProductSummary>
      >((accumulator, order) => {
        const key = order.product.name;

        if (!accumulator[key]) {
          accumulator[key] = {
            name: key,
            category:
              order.product.category ?? null,
            quantity: 0,
            total: 0,
          };
        }

        accumulator[key].quantity += Number(
          order.quantity || 0
        );

        accumulator[key].total += Number(
          order.totalPrice || 0
        );

        return accumulator;
      }, {});

    const productTotals = Object.values(
      productTotalsMap
    );

    const totals = byGojo.reduce(
      (accumulator, row) => {
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
      }
    );

    const totalItems = productTotals.reduce(
      (sum, product) =>
        sum + Number(product.quantity || 0),
      0
    );

    return NextResponse.json({
      /*
       * Keep "session" for compatibility with your
       * existing staff/admin frontend.
       */
      session: todaySession,

      period: {
        range,
        startDate:
          startDate?.toISOString() || null,
        endDate: endDate.toISOString(),
        sessionCount: sessions.length,
      },

      byGojo,
      productTotals,

      totals: {
        ...totals,
        totalItems,
        orderCount: orders.length,
      },
    });
  } catch (error) {
    console.error("Summary API error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unknown summary error";

    return NextResponse.json(
      {
        error: "Failed to load summary.",
        details:
          process.env.NODE_ENV === "development"
            ? message
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}