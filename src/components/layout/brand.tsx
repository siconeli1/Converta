import { FileText } from "lucide-react";
import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Converta, página inicial">
      <span className="brand-mark"><FileText size={17} aria-hidden="true" /></span>
      Converta
    </Link>
  );
}
