"use client";
import { Input } from "@/components/ui/input";
import MainButton from "@/components/ui/primary-button";
import { umi } from "@/lib/utils";
import { createAccount, transferSol } from "@metaplex-foundation/mpl-toolbox";
import {
  createSignerFromKeypair,
  defaultPublicKey,
  Instruction,
  isPublicKey,
  lamports,
  signerIdentity,
  signerPayer,
  sol,
  transactionBuilder,
  publicKey as UmiPublicKey,
} from "@metaplex-foundation/umi";
import { createSignerFromWalletAdapter } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SendTransactionError,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { useState } from "react";
import { toast } from "sonner";

export const SendSolForm = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [recipient, setRecipient] = useState("");

  // ? Solana Web3.js approach
  const handleSendSol = async () => {
    try {
      if (!wallet.publicKey || !recipient) return;
      console.log("Processing the transaction...");
      const amountLamports = 0.1 * LAMPORTS_PER_SOL;
      const recipientPublicKey = new PublicKey(recipient);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: recipientPublicKey,
          lamports: amountLamports,
        }),
      );

      const {
        context: { slot: minContextSlot },
        value: { blockhash, lastValidBlockHeight },
      } = await connection.getLatestBlockhashAndContext();

      const signature = await wallet.sendTransaction(transaction, connection, {
        minContextSlot,
      });

      const confirmation = await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature,
      });

      if (confirmation.value.err) {
        throw new Error("Transaction failed");
      }
      toast("Transaction successful");
      console.log("Transaction successful: ", signature);
    } catch (error) {
      if (error instanceof SendTransactionError) {
        console.error("Transaction error:", error.message);
      } else {
        console.error("Error sending SOL:", error);
      }
    }
  };

  // // ? UMI Approach
  // const handleSendSol = async () => {
  //   try {
  //     if (!wallet.publicKey || !recipient) return;
  //     console.log("Processing the transaction...");
  //     const amountSol = sol(0.1);
  //     const recipientPublicKey = UmiPublicKey(recipient);
  //     const signer = createSignerFromWalletAdapter(wallet);
  //     umi.use(signerIdentity(signer)).use(signerPayer(signer));

  //     const instruction = createAccount(umi, {
  //       lamports: lamports(133700),
  //       newAccount: signer,
  //       programId: defaultPublicKey(),
  //       space: 64,
  //     });

  //     const txBuilder = transactionBuilder()
  //       .add(instruction)
  //       .useV0()
  //       .setFeePayer(signer);

  //     const signature = await txBuilder.send(umi);
  //     if (!signature) {
  //       console.log("Ooooopps!! Trnsaction Failed");
  //       return;
  //     }
  //     toast("Transaction successful");
  //     console.log("Transaction successful: ", signature);
  //   } catch (error) {
  //     if (error instanceof SendTransactionError) {
  //       console.error("Transaction error:", error.message);
  //     } else {
  //       console.error("Error sending SOL:", error);
  //     }
  //   }
  // };

  return (
    <div className="space-y-2 rounded-lg border border-primary/30 bg-transparent p-3 text-white">
      <h3 className="text-center leading-normal">
        Send devnet SOL to your wallet
      </h3>
      <div className="rounded-md border border-primary/60 p-1">
        <Input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="border-none bg-transparent"
        />
      </div>
      <MainButton
        className="w-full rounded-lg bg-transparent"
        text={"Send SOL"}
        onClick={handleSendSol}
        disabled={!recipient || !isPublicKey(recipient)}
      />
    </div>
  );
};
