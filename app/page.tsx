"use client";
import Header from "@/components/global/Header";
import Section from "@/components/global/Section";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

export default function Home() {
  const { connection } = useConnection();
  const wallet = useWallet();

  return (
    <div className="container">
      <Header />
      <Section connection={connection} publicKey={wallet.publicKey ?? null} />
    </div>
  );
}
