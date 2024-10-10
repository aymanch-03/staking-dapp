import { claimToken, getUserBalance } from "@/app/_actions/_actions";
import { calculatePointsPerSecond, explorerUrl } from "@/lib/helpers";
import { authorityKeypair } from "@/lib/utils";
import { Nft } from "@prisma/client";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ToolbarExpandable from "./ui/animated-toolbar";

type Props = {
  stakedNfts: Nft[];
  isLoading: boolean;
};

// ? The balance is updated in the database by calculating the difference between the last login time and the stakedAt time to determine the exact duration the NFT was staked.

export const TokenBalance = ({ stakedNfts, isLoading }: Props) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const { data: response } = useQuery({
    queryKey: ["tokenBalance", publicKey?.toBase58()],
    queryFn: () => getUserBalance(publicKey?.toBase58() ?? ""),
    enabled: !!publicKey,
  });
  const [claimLoading, setClaimLoading] = useState(false);

  useEffect(() => {
    if (response?.success) {
      setTokenBalance(response.data?.balance ?? 0);
    }
  }, [response]);

  useEffect(() => {
    const pointsPerSecond = calculatePointsPerSecond(
      stakedNfts ? stakedNfts.length : 0,
    );

    const intervalId = setInterval(() => {
      setTokenBalance((prevBalance) => prevBalance + pointsPerSecond);
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [stakedNfts]);

  const handleClaimToken = async () => {
    if (!publicKey || tokenBalance <= 0) {
      toast.error("Invalid public key or token balance.");
      return;
    }
    try {
      setClaimLoading(true);
      const response = await claimToken(publicKey.toBase58(), tokenBalance);

      if (!response.success) {
        toast.error(response.message!);
        throw new Error("Failed to retrieve token claim transaction.");
      }

      const transactionBase64 = response.data?.transaction;

      const deserializedTransaction = Transaction.from(
        Buffer.from(JSON.parse(transactionBase64).transaction, "base64"),
      );

      const recentBlockhash = await connection.getLatestBlockhash();

      const messageV0 = new TransactionMessage({
        payerKey: publicKey,
        recentBlockhash: recentBlockhash.blockhash,
        instructions: deserializedTransaction.instructions,
      }).compileToV0Message();

      const versionedTransaction = new VersionedTransaction(messageV0);

      const simulationResult =
        await connection.simulateTransaction(versionedTransaction);
      if (simulationResult.value.err) {
        console.error("Simulation error details:", simulationResult.value.logs);
        throw new Error("Transaction simulation failed.");
      }

      console.log("Sending transaction...");
      const signature = await sendTransaction(
        versionedTransaction,
        connection,
        {
          signers: [authorityKeypair],
        },
      );

      console.log("Awaiting transaction confirmation...");
      const latestBlockhash = await connection.getLatestBlockhash("finalized");

      const confirmation = await toast.promise(
        connection.confirmTransaction(
          {
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            signature,
          },
          "confirmed",
        ),
        {
          loading: "Processing your transaction...",
          success: <b>Transaction confirmed successfully!</b>,
          error: <b>Transaction failed. Please try again.</b>,
        },
      );

      if (confirmation.value.err) {
        throw new Error("Transaction confirmation failed");
      }

      console.log("Transaction successful: ", explorerUrl(signature));
    } catch (error) {
      console.error("Error during token claim:", error);
      toast.error(
        `${error instanceof Error ? error.message : "Unknown error" || "Unable to complete action."}`,
      );
    } finally {
      setClaimLoading(false);
    }
  };

  return (
    <ToolbarExpandable
      claimToken={handleClaimToken}
      isLoading={isLoading}
      claimLoading={claimLoading}
      tokenBalance={tokenBalance}
    />
  );
};
