import type { ConversionStatus } from "@/types/conversion";

const transitions: Record<ConversionStatus, ConversionStatus[]> = {
  uploading: ["queued", "failed"],
  queued: ["processing", "failed"],
  processing: ["completed", "failed"],
  completed: ["expired"],
  failed: ["queued"],
  expired: [],
};

export function canTransition(from: ConversionStatus, to: ConversionStatus) {
  return transitions[from].includes(to);
}
