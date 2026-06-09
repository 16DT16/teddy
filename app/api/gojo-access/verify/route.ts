import {
  NextRequest,
  NextResponse,
} from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyDailyGojoCode } from "@/lib/gojo-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GOJO_ACCESS_COOKIE =
  "ambo_gojo_access";

function cleanText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

/**
 * This GET handler is only for confirming that the API route exists.
 * Customer verification still uses POST.
 */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      message:
        "የጎጆ መግቢያ ማረጋገጫ አገልግሎቱ እየሰራ ነው።",
      method: "POST",
    },
    {
      status: 200,
      headers: {
        "Cache-Control":
          "no-store, max-age=0",
      },
    },
  );
}

export async function POST(
  request: NextRequest,
) {
  try {
    const body = await request
      .json()
      .catch(() => null);

    if (!body) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "የተላከውን መረጃ ማንበብ አልተቻለም። እባክዎ እንደገና ይሞክሩ።",
        },
        {
          status: 400,
        },
      );
    }

    const gojoId = cleanText(
      body.gojoId,
    );

    const code = cleanText(body.code)
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!gojoId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "እባክዎ መጀመሪያ ጎጆዎን ይምረጡ።",
        },
        {
          status: 400,
        },
      );
    }

    if (!code) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "እባክዎ የቀኑን የጎጆ የይለፍ ቃል ያስገቡ።",
        },
        {
          status: 400,
        },
      );
    }

    if (code.length !== 6) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "የቀኑ የይለፍ ቃል 6 አሃዝ መሆን አለበት።",
        },
        {
          status: 400,
        },
      );
    }

    const gojo =
      await prisma.gojo.findFirst({
        where: {
          id: gojoId,
          active: true,
        },
        select: {
          id: true,
          number: true,
          name: true,
        },
      });

    if (!gojo) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "የመረጡት ጎጆ አልተገኘም ወይም ለጊዜው አይገኝም። እባክዎ ሰራተኛውን ያነጋግሩ።",
        },
        {
          status: 404,
        },
      );
    }

    const passwordIsValid =
      verifyDailyGojoCode(
        gojo.id,
        code,
      );

    if (!passwordIsValid) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "ያስገቡት የቀኑ የይለፍ ቃል ትክክል አይደለም። እባክዎ ኮዱን ያረጋግጡ ወይም ሰራተኛውን ይጠይቁ።",
        },
        {
          status: 401,
        },
      );
    }

    const redirectTo =
      `/?gojo=${encodeURIComponent(
        gojo.id,
      )}`;

    const response =
      NextResponse.json(
        {
          ok: true,
          message:
            "ጎጆው በትክክል ተረጋግጧል። ወደ ምናሌው በመግባት ላይ...",
          gojo,
          redirectTo,
        },
        {
          status: 200,
          headers: {
            "Cache-Control":
              "no-store, max-age=0",
          },
        },
      );

    response.cookies.set(
      GOJO_ACCESS_COOKIE,
      gojo.id,
      {
        httpOnly: true,
        sameSite: "lax",
        secure:
          process.env.NODE_ENV ===
          "production",
        maxAge: 60 * 60 * 18,
        path: "/",
      },
    );

    return response;
  } catch (error) {
    console.error(
      "Gojo access verification error:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "የጎጆውን መግቢያ ማረጋገጥ አልተቻለም። እባክዎ ትንሽ ቆይተው እንደገና ይሞክሩ።",
      },
      {
        status: 500,
      },
    );
  }
}