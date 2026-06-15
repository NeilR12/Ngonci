import type { Metadata } from "next";
import { LangProvider } from "@/components/LangProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Konci",
  description: "An offline, zero-knowledge password vault.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
