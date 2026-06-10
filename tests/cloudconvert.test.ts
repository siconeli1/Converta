import { afterEach, describe, expect, it, vi } from "vitest";
import { CloudConvertProvider } from "@/lib/conversion/adapters/cloudconvert";

afterEach(() => vi.restoreAllMocks());

describe("CloudConvertProvider", () => {
  it("creates a job and returns its exported URL", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { id: "job-1", status: "waiting", tasks: [] } }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { id: "job-1", status: "finished", tasks: [{ name: "export-file", result: { files: [{ url: "https://example.com/output.pdf" }] } }] } }), { status: 200 }));
    const provider = new CloudConvertProvider("secret");
    await expect(provider.convert({ sourceUrl: "https://example.com/input.docx", inputFormat: "docx", outputFormat: "pdf", outputName: "output.pdf" }))
      .resolves.toEqual({ jobId: "job-1", downloadUrl: "https://example.com/output.pdf" });
  });
  it("sanitizes provider failures into a domain error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("no", { status: 500 }));
    const provider = new CloudConvertProvider("secret");
    await expect(provider.convert({ sourceUrl: "x", inputFormat: "pdf", outputFormat: "docx", outputName: "x.docx" }))
      .rejects.toMatchObject({ code: "PROVIDER_CREATE_FAILED" });
  });
});
