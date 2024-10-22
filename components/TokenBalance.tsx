import {
  claimToken,
  getUserBalance,
  resetBalance,
} from "@/app/_actions/_actions";
import { MAX_RETRIES } from "@/constants";
import { calculatePointsPerSecond } from "@/lib/helpers";
import { authorityKeypair, signIn } from "@/lib/utils";
import { Nft } from "@prisma/client";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import toast from "react-hot-toast";
import ToolbarExpandable from "./ui/animated-toolbar";

type Props = {
  stakedNfts: Nft[];
  isLoading: boolean;
  tokenBalance: number;
  setTokenBalance: Dispatch<SetStateAction<number>>;
};

export const TokenBalance = ({
  stakedNfts,
  isLoading,
  tokenBalance,
  setTokenBalance,
}: Props) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signMessage } = useWallet();

  const { data: response } = useQuery({
    queryKey: ["tokenBalance", publicKey?.toBase58()],
    queryFn: () => getUserBalance(publicKey?.toBase58() ?? ""),
    enabled: !!publicKey,
    staleTime: 0,
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
  }, [stakedNfts, calculatePointsPerSecond]);

  const handleClaimToken = async () => {
    if (!publicKey || tokenBalance <= 0 || !signMessage) {
      toast.error("Invalid public key or token balance.");
      return;
    }

    setClaimLoading(true);

    try {
      for (let retryCount = 0; retryCount < MAX_RETRIES; retryCount++) {
        try {
          const response = await claimToken(publicKey.toBase58(), tokenBalance);
          if (!response.success || response.status === 401) {
            toast.error(response.message! || "Error while claiming token");

            if (response.status === 401) {
              await signIn(publicKey, signMessage);
              continue;
            }
            throw new Error("Failed to claim token");
          }

          toast.loading(`Claiming ${tokenBalance.toFixed(6)} $DEV`, {
            id: "tokenClaim",
          });

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
          const latestBlockhash =
            await connection.getLatestBlockhash("finalized");
          const confirmation = await connection.confirmTransaction(
            {
              blockhash: latestBlockhash.blockhash,
              lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
              signature,
            },
            "confirmed",
          );

          if (confirmation.value.err) {
            throw new Error("Transaction confirmation failed.");
          }

          const resetResponse = await resetBalance(publicKey.toBase58());
          if (resetResponse.success) {
            console.log("Refetching token balance...");
            setTokenBalance(resetResponse.data?.tokenBalance ?? 0);
            toast.success(
              `Successfully claimed ${tokenBalance.toFixed(6)} $DEV`,
              {
                id: "tokenClaim",
              },
            );
          } else {
            toast.error("Failed to reset balance.");
          }
          break; // Exit the retry loop if successful
        } catch (error) {
          if (retryCount >= MAX_RETRIES - 1) {
            throw error; // Rethrow the error if max retries reached
          }
          console.error("Retrying due to error:", error);
        }
      }
    } catch (error) {
      console.error("Error during token claim:", error);
      toast.error(
        `${error instanceof Error ? error.message : "Unknown error"}`,
        { id: "tokenClaim" },
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
