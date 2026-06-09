import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

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

export async function GET() {
  try {
    const gojos =
      await prisma.gojo.findMany({
        where: {
          active: true,
        },

        select: {
          id: true,
          number: true,
          name: true,
          active: true,
        },

        orderBy: {
          number: "asc",
        },
      });

    return NextResponse.json(
      {
        gojos,
      },
      {
        status: 200,
        headers:
          NO_STORE_HEADERS,
      },
    );
  } catch (error: unknown) {
    console.error(
      "Gojo API error:",
      error,
    );

    if (
      isDatabaseUnavailable(error)
    ) {
      return NextResponse.json(
        {
          error:
            "የመረጃ ቋቱ ግንኙነት ለጊዜው ዘግይቷል። እባክዎ ትንሽ ቆይተው እንደገና ይሞክሩ።",

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
          "የጎጆ ዝርዝሩን መጫን አልተቻለም።",

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