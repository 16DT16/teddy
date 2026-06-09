import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getOrCreateTodaySession,
  startOfToday,
} from "@/lib/day";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GOJO_ACCESS_COOKIE =
  "ambo_gojo_access";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

const orderSchema = z.object({
  gojoId: z.string().min(1),
  productId: z.string().min(1),

  quantity: z.coerce
    .number()
    .int()
    .min(1)
    .max(99),

  customerText: z
    .string()
    .max(500)
    .optional()
    .nullable(),
});

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

function databaseUnavailableResponse(
  action: "load" | "create",
) {
  return NextResponse.json(
    {
      error:
        action === "load"
          ? "የመረጃ ቋቱ ግንኙነት ለጊዜው ዘግይቷል። የትዕዛዝ ዝርዝሩ በራሱ እንደገና ይጫናል።"
          : "ግንኙነቱ ዘግይቷል። ትዕዛዝዎ መላኩ አልተረጋገጠም። እባክዎ ትዕዛዙን ከመድገምዎ በፊት ሰራተኛውን ይጠይቁ።",

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

/*
 * Load today's orders.
 *
 * Important:
 * This GET request no longer creates or updates
 * today's DaySession on every staff poll.
 */
export async function GET() {
  const startedAt = performance.now();

  try {
    const queryStartedAt =
      performance.now();

    const orders =
      await prisma.order.findMany({
        where: {
          session: {
            businessDate:
              startOfToday(),
          },
        },
        include: {
          gojo: true,
          product: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    const queryMs = Math.round(
      performance.now() -
        queryStartedAt,
    );

    const totalMs = Math.round(
      performance.now() -
        startedAt,
    );

    console.log(
      "[Orders timing]",
      {
        queryMs,
        totalMs,
        orderCount:
          orders.length,
      },
    );

    return NextResponse.json(
      {
        orders,
      },
      {
        headers:
          NO_STORE_HEADERS,
      },
    );
  } catch (error) {
    // Keep your existing catch block.
  }
}

/*
 * Create a new customer order.
 *
 * POST still creates today's session when necessary,
 * because an order must belong to a valid DaySession.
 */
export async function POST(
  req: Request,
) {
  try {
    const body = await req
      .json()
      .catch(() => ({}));

    const parsed =
      orderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            "የትዕዛዙ መረጃ ትክክል አይደለም።",

          retryable: false,
        },
        {
          status: 400,
          headers:
            NO_STORE_HEADERS,
        },
      );
    }

    const cookieStore =
      await cookies();

    const verifiedGojoId =
      cookieStore.get(
        GOJO_ACCESS_COOKIE,
      )?.value || "";

    if (!verifiedGojoId) {
      return NextResponse.json(
        {
          error:
            "የጎጆ መግቢያዎ አልተረጋገጠም። እባክዎ የቀኑን የይለፍ ቃል ያስገቡ ወይም QR ኮዱን ስካን ያድርጉ።",

          redirectTo:
            "/access",

          retryable: false,
        },
        {
          status: 403,
          headers:
            NO_STORE_HEADERS,
        },
      );
    }

    /*
     * A customer verified for one Gojo
     * cannot submit an order for another Gojo.
     */
    if (
      verifiedGojoId !==
      parsed.data.gojoId
    ) {
      return NextResponse.json(
        {
          error:
            "ለተመረጠው ጎጆ መግቢያዎ አልተረጋገጠም። እባክዎ ጎጆውን እንደገና ያረጋግጡ።",

          redirectTo:
            "/access",

          retryable: false,
        },
        {
          status: 403,
          headers:
            NO_STORE_HEADERS,
        },
      );
    }

    /*
     * Creating an order genuinely requires
     * today's DaySession, so keep the upsert here.
     */
    const session =
      await getOrCreateTodaySession();

    const [gojo, product] =
      await Promise.all([
        prisma.gojo.findFirst({
          where: {
            id: parsed.data.gojoId,
            active: true,
          },

          select: {
            id: true,
          },
        }),

        prisma.product.findFirst({
          where: {
            id: parsed.data.productId,
            active: true,
          },

          select: {
            id: true,
            price: true,
          },
        }),
      ]);

    if (!gojo) {
      return NextResponse.json(
        {
          error:
            "የተመረጠው ጎጆ አልተገኘም ወይም ለጊዜው አይገኝም።",

          retryable: false,
        },
        {
          status: 404,
          headers:
            NO_STORE_HEADERS,
        },
      );
    }

    if (!product) {
      return NextResponse.json(
        {
          error:
            "የተመረጠው ምርት አልተገኘም ወይም ለጊዜው አይገኝም።",

          retryable: false,
        },
        {
          status: 404,
          headers:
            NO_STORE_HEADERS,
        },
      );
    }

    const unitPrice =
      Number(product.price);

    if (
      !Number.isFinite(
        unitPrice,
      ) ||
      unitPrice < 0
    ) {
      return NextResponse.json(
        {
          error:
            "የምርቱ ዋጋ ትክክል አይደለም። እባክዎ ሰራተኛውን ያነጋግሩ።",

          retryable: false,
        },
        {
          status: 500,
          headers:
            NO_STORE_HEADERS,
        },
      );
    }

    const totalPrice =
      unitPrice *
      parsed.data.quantity;

    const order =
      await prisma.order.create({
        data: {
          sessionId:
            session.id,

          gojoId:
            gojo.id,

          productId:
            product.id,

          quantity:
            parsed.data.quantity,

          customerText:
            parsed.data.customerText?.trim() ||
            null,

          unitPrice,
          totalPrice,
        },

        include: {
          gojo: true,
          product: true,
        },
      });

    return NextResponse.json(
      {
        order,

        message:
          "ትዕዛዝዎ በትክክል ተልኳል።",

        retryable: false,
      },
      {
        status: 201,
        headers:
          NO_STORE_HEADERS,
      },
    );
  } catch (error: unknown) {
    console.error(
      "Failed to create order:",
      error,
    );

    if (
      isDatabaseUnavailable(error)
    ) {
      return databaseUnavailableResponse(
        "create",
      );
    }

    return NextResponse.json(
      {
        error:
          "ትዕዛዙን መላክ አልተቻለም። እባክዎ ትንሽ ቆይተው እንደገና ይሞክሩ።",

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