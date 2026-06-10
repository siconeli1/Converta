import { CloudConvertProvider } from "@/lib/conversion/adapters/cloudconvert";
import type { ConversionProvider } from "@/lib/conversion/provider";

export function getConversionProvider(): ConversionProvider {
  const name = process.env.CONVERSION_PROVIDER || "cloudconvert";
  const apiKey = process.env.CONVERSION_API_KEY;
  if (!apiKey) throw new Error("CONVERSION_API_KEY is not configured");
  if (name === "cloudconvert") return new CloudConvertProvider(apiKey);
  throw new Error(`Unsupported conversion provider: ${name}`);
}
