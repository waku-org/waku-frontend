import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Menu } from "@/app/components/Menu";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "nwaku front-end",
  description: "Send messages through you local node, register to RLN, read and export Keystore",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Menu />
        {children}
      </body>
    </html>
  );
}
