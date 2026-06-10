import CloudConvert from "cloudconvert";
import { Readable } from "node:stream";
import {
  ConversionProviderError,
  type ConversionInput,
  type ConversionProvider,
  type ConversionResult,
} from "@/lib/conversion/provider";

export class CloudConvertProvider implements ConversionProvider {
  readonly name = "cloudconvert";
  private readonly client: CloudConvert;

  constructor(apiKey: string) {
    this.client = new CloudConvert(apiKey);
  }

  async convert(input: ConversionInput): Promise<ConversionResult> {
    try {
      let job = await this.client.jobs.create({
        tasks: {
          "import-file": { operation: "import/upload" },
          "convert-file": {
            operation: "convert",
            input: "import-file",
            input_format: input.inputFormat,
            output_format: input.outputFormat,
            filename: input.outputName,
          },
          "export-file": { operation: "export/url", input: "convert-file", inline: false },
        },
      });

      const uploadTask = job.tasks.find((task) => task.name === "import-file");
      if (!uploadTask) {
        throw new ConversionProviderError("PROVIDER_UPLOAD_MISSING", "O provedor não preparou o envio.");
      }

      await this.client.tasks.upload(
        uploadTask,
        Readable.from(input.source),
        input.sourceName,
        input.source.length,
      );
      job = await this.client.jobs.wait(job.id);

      if (job.status !== "finished") {
        throw new ConversionProviderError(
          "PROVIDER_JOB_FAILED",
          "A conversão falhou no provedor.",
        );
      }

      const file = this.client.jobs.getExportUrls(job)[0];
      if (!file?.url) {
        throw new ConversionProviderError(
          "PROVIDER_OUTPUT_MISSING",
          "O arquivo convertido não foi retornado.",
        );
      }

      return { jobId: job.id, downloadUrl: file.url };
    } catch (error) {
      if (error instanceof ConversionProviderError) throw error;
      throw new ConversionProviderError(
        "PROVIDER_CREATE_FAILED",
        "Não foi possível concluir a conversão.",
      );
    }
  }
}
