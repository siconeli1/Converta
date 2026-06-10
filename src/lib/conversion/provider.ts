import type { FileExtension } from "@/types/conversion";

export interface ConversionInput {
  source: Buffer;
  sourceName: string;
  inputFormat: FileExtension;
  outputFormat: FileExtension;
  outputName: string;
}

export interface ConversionResult {
  jobId: string;
  downloadUrl: string;
}

export interface ConversionProvider {
  readonly name: string;
  convert(input: ConversionInput): Promise<ConversionResult>;
}

export class ConversionProviderError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "ConversionProviderError";
  }
}
