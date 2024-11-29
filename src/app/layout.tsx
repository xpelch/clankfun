/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import "~/styles/globals.css";
import '@rainbow-me/rainbowkit/styles.css';

import { Poppins } from "next/font/google";
import { type Metadata } from "next";
import { Toaster } from "@/components/ui/toaster"
import { Web3Provider } from "./web3provider";

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
        <body>
          <Web3Provider>
            {children}
            <Toaster />
          </Web3Provider>
        </body>
      </html>
  );
}
