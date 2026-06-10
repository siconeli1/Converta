import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";

export const metadata: Metadata = {
  title: { default: "Converta", template: "%s | Converta" },
  description: "Converta PDF e DOCX com segurança, histórico e download imediato.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
