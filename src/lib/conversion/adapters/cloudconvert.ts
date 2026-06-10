import CloudConvert from "cloudconvert";
import { Readable } from "node:stream";
import {
  ConversionProviderError,
  type ConversionInput,
  type ConversionProvider,
  type ConversionResult,
} from "@/lib/conversion/provider";

interface CloudConvertErrorBody {
  code?: string;
  message?: string;
}

async function mapCloudConvertError(error: unknown) {
  const cause = error instanceof Error ? error.cause : undefined;
  const response = cause instanceof Response ? cause : undefined;
  let body: CloudConvertErrorBody = {};

  if (response) {
    try {
      body = await response.clone().json() as CloudConvertErrorBody;
    } catch {
      // Some provider errors do not include a JSON response.
    }
  }

  const details = {
    provider: "cloudconvert",
    providerStatus: response?.status,
    providerCode: body.code,
    providerMessage: body.message,
  };

  if (response?.status === 402 || body.code === "CREDITS_EXCEEDED") {
    return new ConversionProviderError(
      "PROVIDER_CREDITS_EXCEEDED",
      "O limite de conversões foi atingido. Tente novamente após a renovação dos créditos.",
      details,
    );
  }

  if (response?.status === 401) {
    return new ConversionProviderError(
      "PROVIDER_AUTH_FAILED",
      "O serviço de conversão não está autenticado corretamente.",
      details,
    );
  }

  if (response?.status === 403) {
    return new ConversionProviderError(
      "PROVIDER_ACCESS_DENIED",
      "O serviço de conversão não possui as permissões necessárias.",
      details,
    );
  }

  if (response?.status === 429) {
    return new ConversionProviderError(
      "PROVIDER_RATE_LIMITED",
      "O serviço de conversão está temporariamente ocupado. Tente novamente em alguns minutos.",
      details,
    );
  }

  return new ConversionProviderError(
    "PROVIDER_CREATE_FAILED",
    "Não foi possível concluir a conversão.",
    details,
  );
}

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
      throw await mapCloudConvertError(error);
    }
  }
}
