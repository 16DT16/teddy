import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { getDailyGojoCode } from "@/lib/gojo-access";
import { startOfToday } from "@/lib/day";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CachedGojo = {
  id: string;
  number: number;
  name: string | null;
};

type GojoCache = {
  items: CachedGojo[];
  expiresAt: number;
};

const GOJO_CACHE_TTL_MS =
  60 * 1000;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

let gojoCache: GojoCache | null = null;

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
    ) ||
    message.includes(
      "prepared statement",
    ) ||
    message.includes("42P05")
  );
}

async function getActiveGojos() {
  const now = Date.now();

  if (
    gojoCache &&
    gojoCache.expiresAt > now
  ) {
    return gojoCache.items;
  }

  const gojos =
    await prisma.gojo.findMany({
      where: {
        active: true,
      },

      orderBy: {
        number: "asc",
      },

      select: {
        id: true,
        number: true,
        name: true,
      },
    });

  gojoCache = {
    items: gojos,
    expiresAt:
      now + GOJO_CACHE_TTL_MS,
  };

  return gojos;
}

export async function GET() {
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
    const businessDate =
      startOfToday();

    const gojos =
      await getActiveGojos();

    const codes = gojos.map(
      (gojo) => ({
        ...gojo,

        code:
          getDailyGojoCode(
            gojo.id,
            businessDate,
          ),
      }),
    );

    return NextResponse.json(
      {
        businessDate:
          businessDate.toISOString(),

        codes,
      },
      {
        status: 200,
        headers:
          NO_STORE_HEADERS,
      },
    );
  } catch (error: unknown) {
    console.error(
      "Load Gojo access codes error:",
      error,
    );

    if (
      isDatabaseUnavailable(error)
    ) {
      return NextResponse.json(
        {
          error:
            "የመረጃ ቋቱ ግንኙነት ለጊዜው ዘግይቷል። የጎጆ የይለፍ ቃሎቹ በራሳቸው እንደገና ይጫናሉ።",

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
          "የቀኑን የጎጆ የይለፍ ቃሎች መጫን አልተቻለም።",

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