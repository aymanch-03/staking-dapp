import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { clusterApiUrl, Keypair } from "@solana/web3.js";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const umi = createUmi(process.env.NEXT_PUBLIC_RPC ?? clusterApiUrl("devnet"))

export const authorityKeypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(process.env.NEXT_PUBLIC_AUTHORITY_PRIVATE_KEY!))
);
