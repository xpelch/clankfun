/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import "~/styles/globals.css";
// import '@rainbow-me/rainbowkit/styles.css';

import { Poppins } from "next/font/google";
import { type Metadata } from "next";
import { Toaster } from "@/components/ui/toaster"
import { Web3Provider } from "./web3provider";
import { useEffect } from "react";

const firaCode = Poppins({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-fira-code",
});

const APP_NAME = "clank.fun";
const APP_DEFAULT_TITLE = "clank.fun";
const APP_TITLE_TEMPLATE = "%s - clank.fun";
const APP_DESCRIPTION = "find and trade clanker memecoins";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    images: ['https://clank.fun/og.png'],
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    images: ['https://clank.fun/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {

  useEffect(() => {
    console.log("Starting up cfun")
  }, [])

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
