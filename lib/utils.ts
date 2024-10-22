import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { clsx, type ClassValue } from "clsx";
import { getCsrfToken, signIn as signInNextauth } from "next-auth/react";
import { twMerge } from "tailwind-merge";
import { SigninMessage } from "./SigninMessage";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const umi = createUmi(
  process.env.NEXT_PUBLIC_RPC ?? clusterApiUrl("devnet"),
);

export const authorityKeypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(process.env.NEXT_PUBLIC_AUTHORITY_PRIVATE_KEY!)),
);

export const connection = new Connection(clusterApiUrl("devnet"));

export const signIn = async (
  ownerPublicKey: PublicKey,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>,
): Promise<void> => {
  try {
    const csrf = await getCsrfToken();
    if (!ownerPublicKey || !csrf || !signMessage) {
      console.error("Missing required parameters for signIn.");
      return;
    }

    const message = new SigninMessage({
      domain: window.location.host || "",
      publicKey: ownerPublicKey.toBase58(),
      statement: "Sign this message to log in to the app.\n",
      nonce: csrf,
    });

    const data = new TextEncoder().encode(message.prepare());
    const signature = await signMessage(data);
    const serializedSignature = bs58.encode(signature);

    const response = await signInNextauth("signMessage", {
      message: JSON.stringify(message),
      signature: serializedSignature,
      redirect: false,
    });

    if (response?.error) {
      console.error("Error during sign-in:", response.error);
    }
  } catch (error) {
    console.error("An error occurred during sign-in:", error);
  }
};
