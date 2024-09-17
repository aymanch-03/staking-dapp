"use client";
import Header from "@/components/global/Header";
import Section from "@/components/global/Section";
import { useGetBalance } from "@/hooks/useGetBalance";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

export default function Home() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const balance = useGetBalance(wallet.publicKey, connection);

  return (
    <div className="container">
      <Header
        connection={connection}
        publicKey={wallet.publicKey}
        balance={balance}
      />
      <Section connection={connection} publicKey={wallet.publicKey ?? null} />
    </div>
  );
}
