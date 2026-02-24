import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import "@/app/globals.css";
import { SessionProvider } from "@/components/providers/session-provider";

const manrope = Manrope({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MockAI",
  description: "AI-powered resume-aware interview mocker",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={manrope.className}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
