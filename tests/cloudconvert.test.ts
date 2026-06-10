import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  upload: vi.fn(),
  wait: vi.fn(),
  getExportUrls: vi.fn(),
}));

vi.mock("cloudconvert", () => ({
  default: class {
    jobs = {
      create: mocks.create,
      wait: mocks.wait,
      getExportUrls: mocks.getExportUrls,
    };
    tasks = { upload: mocks.upload };
  },
}));

import { CloudConvertProvider } from "@/lib/conversion/adapters/cloudconvert";

afterEach(() => vi.clearAllMocks());

describe("CloudConvertProvider", () => {
  it("uploads a private source and returns its exported URL", async () => {
    const uploadTask = { id: "upload-1", name: "import-file", operation: "import/upload" };
    mocks.create.mockResolvedValue({
      id: "job-1",
      status: "waiting",
      tasks: [uploadTask],
    });
    mocks.upload.mockResolvedValue(undefined);
    mocks.wait.mockResolvedValue({
      id: "job-1",
      status: "finished",
      tasks: [],
    });
    mocks.getExportUrls.mockReturnValue([{ url: "https://example.com/output.pdf" }]);

    const provider = new CloudConvertProvider("secret");
    await expect(provider.convert({
      source: Buffer.from("document"),
      sourceName: "input.docx",
      inputFormat: "docx",
      outputFormat: "pdf",
      outputName: "output.pdf",
    })).resolves.toEqual({
      jobId: "job-1",
      downloadUrl: "https://example.com/output.pdf",
    });

    expect(mocks.upload).toHaveBeenCalledWith(
      uploadTask,
      expect.anything(),
      "input.docx",
      8,
    );
  });

  it("sanitizes provider failures into a domain error", async () => {
    mocks.create.mockRejectedValue(new Error("provider unavailable"));
    const provider = new CloudConvertProvider("secret");

    await expect(provider.convert({
      source: Buffer.from("x"),
      sourceName: "input.pdf",
      inputFormat: "pdf",
      outputFormat: "docx",
      outputName: "output.docx",
    })).rejects.toMatchObject({ code: "PROVIDER_CREATE_FAILED" });
  });
});
