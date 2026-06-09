import { createHmac } from "crypto";
import { startOfToday } from "@/lib/day";

function accessSecret() {
  const value =
    process.env.GOJO_ACCESS_SECRET ||
    process.env.SESSION_SECRET;

  if (!value) {
    throw new Error(
      "GOJO_ACCESS_SECRET or SESSION_SECRET is missing.",
    );
  }

  return value;
}

export function getDailyGojoCode(
  gojoId: string,
  businessDate = startOfToday(),
) {
  const dateKey = businessDate
    .toISOString()
    .slice(0, 10);

  const hash = createHmac(
    "sha256",
    accessSecret(),
  )
    .update(`${dateKey}:${gojoId}`)
    .digest("hex");

  const numericValue =
    Number.parseInt(hash.slice(0, 10), 16) %
    1_000_000;

  return numericValue
    .toString()
    .padStart(6, "0");
}

export function verifyDailyGojoCode(
  gojoId: string,
  submittedCode: string,
) {
  const expectedCode =
    getDailyGojoCode(gojoId);

  return submittedCode.trim() === expectedCode;
}