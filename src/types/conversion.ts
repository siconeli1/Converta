export const conversionStatuses = ["uploading", "queued", "processing", "completed", "failed", "expired"] as const;
export type ConversionStatus = (typeof conversionStatuses)[number];
export type FileExtension = "docx" | "pdf";

export interface ConversionDocument {
  id: string;
  userId: string;
  originalName: string;
  originalExtension: FileExtension;
  outputExtension: FileExtension;
  originalStoragePath: string;
  outputStoragePath: string | null;
  originalSize: number;
  outputSize: number | null;
  status: ConversionStatus;
  provider: string;
  providerJobId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  attemptCount: number;
  createdAt: unknown;
  updatedAt: unknown;
  completedAt: unknown | null;
  expiresAt: unknown | null;
}
