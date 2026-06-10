import {
  FieldValue,
  Timestamp,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";
import type { ConversionQuotaStatus } from "@/types/quota";

const DEFAULT_GLOBAL_LIMIT = 10;
const DEFAULT_USER_LIMIT = 2;
const DEFAULT_COOLDOWN_SECONDS = 60;

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function getQuotaConfig() {
  return {
    globalLimit: positiveInteger(
      process.env.CONVERSION_DAILY_GLOBAL_LIMIT,
      DEFAULT_GLOBAL_LIMIT,
    ),
    userLimit: positiveInteger(
      process.env.CONVERSION_DAILY_USER_LIMIT,
      DEFAULT_USER_LIMIT,
    ),
    cooldownSeconds: positiveInteger(
      process.env.CONVERSION_COOLDOWN_SECONDS,
      DEFAULT_COOLDOWN_SECONDS,
    ),
  };
}

export function getQuotaWindow(now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  const resetAt = new Date(`${day}T00:00:00.000Z`);
  resetAt.setUTCDate(resetAt.getUTCDate() + 1);
  return { day, resetAt };
}

interface QuotaDocument {
  used?: number;
  lastAttemptAt?: Timestamp;
}

export class ConversionQuotaError extends Error {
  constructor(
    public readonly code: "GLOBAL_DAILY_LIMIT" | "USER_DAILY_LIMIT" | "USER_RATE_LIMITED",
    message: string,
    public readonly retryAt: Date,
  ) {
    super(message);
    this.name = "ConversionQuotaError";
  }
}

export function buildConversionQuotaStatus(
  globalUsed: number,
  userUsed: number,
  lastAttemptAt: Date | null,
  now: Date,
): ConversionQuotaStatus {
  const config = getQuotaConfig();
  const { day, resetAt } = getQuotaWindow(now);
  const globalRemaining = Math.max(0, config.globalLimit - globalUsed);
  const userRemaining = Math.max(0, config.userLimit - userUsed);
  const nextAllowedAt = lastAttemptAt
    ? new Date(lastAttemptAt.getTime() + config.cooldownSeconds * 1000)
    : null;
  const coolingDown = Boolean(nextAllowedAt && nextAllowedAt > now);
  const blockedReason = globalRemaining === 0
    ? "GLOBAL_LIMIT"
    : userRemaining === 0
      ? "USER_LIMIT"
      : coolingDown
        ? "RATE_LIMIT"
        : null;

  return {
    day,
    globalLimit: config.globalLimit,
    globalUsed,
    globalRemaining,
    userLimit: config.userLimit,
    userUsed,
    userRemaining,
    remaining: Math.min(globalRemaining, userRemaining),
    canConvert: blockedReason === null,
    blockedReason,
    nextAllowedAt: coolingDown ? nextAllowedAt?.toISOString() || null : null,
    resetAt: resetAt.toISOString(),
  };
}

function quotaReferences(db: Firestore, userId: string, now: Date) {
  const { day } = getQuotaWindow(now);
  const global = db.collection("conversionQuotas").doc(day);
  return {
    global,
    user: global.collection("users").doc(userId),
  };
}

export async function getConversionQuotaStatus(
  db: Firestore,
  userId: string,
  now = new Date(),
) {
  const references = quotaReferences(db, userId, now);
  const [globalSnapshot, userSnapshot] = await Promise.all([
    references.global.get(),
    references.user.get(),
  ]);
  const globalData = globalSnapshot.data() as QuotaDocument | undefined;
  const userData = userSnapshot.data() as QuotaDocument | undefined;

  return buildConversionQuotaStatus(
    globalData?.used || 0,
    userData?.used || 0,
    userData?.lastAttemptAt?.toDate() || null,
    now,
  );
}

export async function claimConversionQuota(
  db: Firestore,
  transaction: Transaction,
  userId: string,
  now = new Date(),
) {
  const config = getQuotaConfig();
  const { resetAt } = getQuotaWindow(now);
  const references = quotaReferences(db, userId, now);
  const [globalSnapshot, userSnapshot] = await Promise.all([
    transaction.get(references.global),
    transaction.get(references.user),
  ]);
  const globalData = globalSnapshot.data() as QuotaDocument | undefined;
  const userData = userSnapshot.data() as QuotaDocument | undefined;
  const status = buildConversionQuotaStatus(
    globalData?.used || 0,
    userData?.used || 0,
    userData?.lastAttemptAt?.toDate() || null,
    now,
  );

  if (status.blockedReason === "GLOBAL_LIMIT") {
    throw new ConversionQuotaError(
      "GLOBAL_DAILY_LIMIT",
      "As conversões gratuitas de hoje terminaram. O limite será renovado automaticamente.",
      resetAt,
    );
  }
  if (status.blockedReason === "USER_LIMIT") {
    throw new ConversionQuotaError(
      "USER_DAILY_LIMIT",
      "Você já utilizou suas conversões gratuitas de hoje.",
      resetAt,
    );
  }
  if (status.blockedReason === "RATE_LIMIT") {
    throw new ConversionQuotaError(
      "USER_RATE_LIMITED",
      "Aguarde um instante antes de iniciar outra conversão.",
      new Date(status.nextAllowedAt || resetAt),
    );
  }

  const timestamp = Timestamp.fromDate(now);
  transaction.set(references.global, {
    used: FieldValue.increment(1),
    limit: config.globalLimit,
    updatedAt: timestamp,
  }, { merge: true });
  transaction.set(references.user, {
    used: FieldValue.increment(1),
    limit: config.userLimit,
    lastAttemptAt: timestamp,
    updatedAt: timestamp,
  }, { merge: true });

  return buildConversionQuotaStatus(
    status.globalUsed + 1,
    status.userUsed + 1,
    now,
    now,
  );
}

export async function markConversionQuotaExhausted(
  db: Firestore,
  now = new Date(),
) {
  const config = getQuotaConfig();
  const { global } = quotaReferences(db, "system", now);
  await global.set({
    used: config.globalLimit,
    limit: config.globalLimit,
    providerExhausted: true,
    updatedAt: Timestamp.fromDate(now),
  }, { merge: true });
}
