"use client"

import {
  base,
} from 'wagmi/chains';
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { env } from '~/env';

const config = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [base],
    transports: {
      [base.id]: http(env.NEXT_PUBLIC_ALCHEMY_BASE_ENDPOINT),
    },

    // Required API Keys
    walletConnectProjectId: "562e09c2f744bbd6cf65d85eb7e0bb78",
    appName: "clank.fun",
    appDescription: "find and trade clanker memecoins",
    appUrl: "https://clank.fun", // your app's url
    appIcon: "https://clank.fun/favicon.ico", // your app's icon, no bigger than 1024x1024px (max. 1MB)
  }),
);


const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}