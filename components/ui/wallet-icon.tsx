import { Wallet } from "@solana/wallet-adapter-react";
import Image from "next/image";

type WalletIconProps = {
  wallet: Wallet;
  size?: "sm" | "md";
};

export const WalletIcon = ({ wallet, size = "sm" }: WalletIconProps) => (
  <Image
    src={wallet.adapter.icon}
    alt={wallet.adapter.name}
    width={size === "sm" ? 20 : 26}
    height={size === "sm" ? 20 : 26}
  />
);
