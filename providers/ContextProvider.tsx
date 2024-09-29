"use client";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  Coin98WalletAdapter,
  CoinbaseWalletAdapter,
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  TrustWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { Toaster } from "react-hot-toast";
export default function ContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new LedgerWalletAdapter(),
      new TorusWalletAdapter(),
      new SolflareWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new Coin98WalletAdapter(),
      new TrustWalletAdapter(),
    ],
    [],
  );
  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_RPC ?? clusterApiUrl("devnet"),
    [],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <QueryClientProvider client={queryClient}>
          <div vaul-drawer-wrapper="">{children}</div>
        </QueryClientProvider>
        <Toaster
          toastOptions={{
            style: {
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(2px)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "rgba(255,255,255)",
              borderRadius: "10px",
            },
          }}
        />
      </WalletProvider>
    </ConnectionProvider>
  );
}
