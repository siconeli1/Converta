import { sanitizeFileName } from "@/lib/utils";
import type { FileExtension } from "@/types/conversion";

export const MIME_TYPES: Record<FileExtension, string[]> = {
  pdf: ["application/pdf"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};

export function getExtension(name: string): FileExtension | null {
  const extension = name.split(".").pop()?.toLowerCase();
  return extension === "pdf" || extension === "docx" ? extension : null;
}

export function getOutputExtension(input: FileExtension): FileExtension {
  return input === "pdf" ? "docx" : "pdf";
}

export function buildOutputName(name: string) {
  const extension = getExtension(name);
  if (!extension) throw new Error("Unsupported file extension");
  const base = sanitizeFileName(name.replace(/\.[^.]+$/, "")) || "documento";
  return `${base}-convertido.${getOutputExtension(extension)}`;
}

export function validateFileMetadata(file: { name: string; size: number; type?: string }, maxSizeMb = 20) {
  const extension = getExtension(file.name);
  if (!extension) return { valid: false as const, error: "Envie um arquivo PDF ou DOCX." };
  if (file.size <= 0) return { valid: false as const, error: "O arquivo está vazio." };
  if (file.size > maxSizeMb * 1024 * 1024) {
    return { valid: false as const, error: `O arquivo deve ter no máximo ${maxSizeMb} MB.` };
  }
  if (file.type && !MIME_TYPES[extension].includes(file.type)) {
    return { valid: false as const, error: "O tipo do arquivo não corresponde à extensão." };
  }
  return { valid: true as const, extension, outputExtension: getOutputExtension(extension) };
}
