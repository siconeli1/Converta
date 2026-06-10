export interface ConversionQuotaStatus {
  day: string;
  globalLimit: number;
  globalUsed: number;
  globalRemaining: number;
  userLimit: number;
  userUsed: number;
  userRemaining: number;
  remaining: number;
  canConvert: boolean;
  blockedReason: "GLOBAL_LIMIT" | "USER_LIMIT" | "RATE_LIMIT" | null;
  nextAllowedAt: string | null;
  resetAt: string;
}
