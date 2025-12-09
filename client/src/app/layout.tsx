import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FileProvider } from "@/context/FileContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ReTextify",
  description: "AI-Powered Text Editor for Images and PDFs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <FileProvider>
          {children}
        </FileProvider>
      </body>
    </html>
  );
}
