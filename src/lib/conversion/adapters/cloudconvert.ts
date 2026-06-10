import {
  ConversionProviderError,
  type ConversionInput,
  type ConversionProvider,
  type ConversionResult,
} from "@/lib/conversion/provider";

type CloudConvertJob = {
  id: string;
  status: string;
  message?: string;
  tasks: Array<{
    name: string;
    result?: { files?: Array<{ url: string }> };
  }>;
};

export class CloudConvertProvider implements ConversionProvider {
  readonly name = "cloudconvert";
  private readonly baseUrl = "https://api.cloudconvert.com/v2";

  constructor(private readonly apiKey: string) {}

  async convert(input: ConversionInput): Promise<ConversionResult> {
    const response = await fetch(`${this.baseUrl}/jobs`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        tasks: {
          "import-file": { operation: "import/url", url: input.sourceUrl },
          "convert-file": {
            operation: "convert",
            input: "import-file",
            input_format: input.inputFormat,
            output_format: input.outputFormat,
            filename: input.outputName,
          },
          "export-file": { operation: "export/url", input: "convert-file", inline: false },
        },
      }),
    });
    if (!response.ok) throw new ConversionProviderError("PROVIDER_CREATE_FAILED", "Não foi possível iniciar a conversão.");
    const created = (await response.json()) as { data: CloudConvertJob };
    const wait = await fetch(`${this.baseUrl}/jobs/${created.data.id}/wait`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!wait.ok) throw new ConversionProviderError("PROVIDER_WAIT_FAILED", "O provedor não concluiu a conversão.");
    const job = ((await wait.json()) as { data: CloudConvertJob }).data;
    if (job.status !== "finished") {
      throw new ConversionProviderError("PROVIDER_JOB_FAILED", job.message || "A conversão falhou no provedor.");
    }
    const file = job.tasks.find((task) => task.name === "export-file")?.result?.files?.[0];
    if (!file?.url) throw new ConversionProviderError("PROVIDER_OUTPUT_MISSING", "O arquivo convertido não foi retornado.");
    return { jobId: job.id, downloadUrl: file.url };
  }
}
