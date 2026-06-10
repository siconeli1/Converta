import { describe, expect, it } from "vitest";
import { buildOutputName, getOutputExtension, validateFileMetadata } from "@/lib/validation/file";

describe("file validation", () => {
  it("accepts supported files", () => {
    expect(validateFileMetadata({ name: "trabalho.pdf", size: 1024, type: "application/pdf" }).valid).toBe(true);
    expect(validateFileMetadata({ name: "trabalho.docx", size: 1024, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }).valid).toBe(true);
  });
  it("rejects unsupported and oversized files", () => {
    expect(validateFileMetadata({ name: "image.png", size: 1024 }).valid).toBe(false);
    expect(validateFileMetadata({ name: "large.pdf", size: 21 * 1024 * 1024 }).valid).toBe(false);
  });
  it("builds safe output names", () => {
    expect(buildOutputName("Meu Trabalho Final.docx")).toBe("Meu-Trabalho-Final-convertido.pdf");
    expect(getOutputExtension("pdf")).toBe("docx");
  });
});
