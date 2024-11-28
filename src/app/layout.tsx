/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import "~/styles/globals.css";

import { Poppins } from "next/font/google";
import { type Metadata } from "next";
import { Toaster } from "@/components/ui/toaster"

const firaCode = Poppins({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-fira-code",
});

export const metadata: Metadata = {
  title: "clank.fun",
  description: "latest clanker memecoins on Farcaster",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${firaCode.variable} dark`}>
      <body>{children}</body>
      <Toaster />
    </html>
  );
}
