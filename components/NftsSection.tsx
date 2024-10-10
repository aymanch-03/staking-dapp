/* eslint-disable react-hooks/exhaustive-deps */
import {
  buildStakeTransaction,
  buildUnstakeTransaction,
  getUserNfts,
  loginUser,
  updateNftsStatus,
} from "@/app/_actions/_actions";
import OwnedNfts from "@/components/OwnedNfts";
import StakedNfts from "@/components/StakedNfts";
import { TABS } from "@/constants";
import { explorerUrl } from "@/lib/helpers";
import { authorityKeypair } from "@/lib/utils";
import { Tab } from "@/ui/tabs";
import { Nft } from "@prisma/client";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { TokenBalance } from "./TokenBalance";

type Props = {
  connection: Connection;
  ownerPublicKey: PublicKey;
};

export const NftsSection = ({ connection, ownerPublicKey }: Props) => {
  const {
    data: response,
    isLoading: loading,
    isError,
  } = useQuery({
    queryKey: ["loginUser", ownerPublicKey?.toBase58()],
    queryFn: () => loginUser(ownerPublicKey.toBase58()),
    enabled: !!ownerPublicKey,
  });

  const refreshNfts = useCallback(async () => {
    if (!ownerPublicKey) return;

    setIsLoading(true);
    try {
      const response = await getUserNfts(ownerPublicKey.toBase58());

      if (response.success) {
        setStakedNfts(response.data?.stakedNfts ?? []);
        setUnstakedNfts(response.data?.unstakedNfts ?? []);
      } else {
        console.error("No NFTs returned from getUserNfts");
      }
    } catch (error) {
      console.error("Error fetching NFTs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [ownerPublicKey]);

  const [selected, setSelected] = useState<string>(TABS[0]);

  const { sendTransaction } = useWallet();

  const [stakedNfts, setStakedNfts] = useState<Nft[]>([]);
  const [unstakedNfts, setUnstakedNfts] = useState<Nft[]>([]);

  const [selectedNfts, setSelectedNfts] = useState<Nft[]>([]);
  const [toUnstakeNfts, setToUnstakeNfts] = useState<Nft[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleStaking = useCallback(async () => {
    if (!ownerPublicKey || !connection) {
      console.error("Missing public key or connection");
      return;
    }

    if (!selectedNfts || selectedNfts.length === 0) {
      console.log("No NFTs selected or all are already staked");
      return;
    }

    setIsLoading(true);

    try {
      if (!authorityKeypair) {
        throw new Error("No authority key found");
      }
      const buildingTxResponse = await buildStakeTransaction(
        ownerPublicKey.toBase58(),
        selectedNfts,
      );
      if (!buildingTxResponse.success) {
        toast.error(
          buildingTxResponse?.message || "Error while building transaction",
        );
        throw new Error("Failed to build stake transaction");
      }

      const transactionBase64 = buildingTxResponse.data?.transaction;

      const transaction = Transaction.from(
        Buffer.from(transactionBase64, "base64"),
      );

      toast.loading("Sending Transaction", { id: "tx" });
      const latestBlockhash = await connection.getLatestBlockhash("finalized");

      const messageV0 = new TransactionMessage({
        recentBlockhash: latestBlockhash.blockhash,
        instructions: transaction.instructions,
        payerKey: ownerPublicKey,
      }).compileToV0Message();

      const versionedTransaction = new VersionedTransaction(messageV0);

      const simulationResult =
        await connection.simulateTransaction(versionedTransaction);
      if (simulationResult.value.err) {
        console.error(
          "Trnsaction simulation failed: ",
          simulationResult.value.logs,
        );
        toast.error("Trnsaction simulation failed", { id: "tx" });
        return;
      }

      const signature = await sendTransaction(
        versionedTransaction,
        connection,
        {
          signers: [authorityKeypair],
        },
      );

      const confirmation = await connection.confirmTransaction({
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        signature,
      });

      if (confirmation.value.err) {
        throw new Error("Transaction confirmation failed");
      }

      const response = await updateNftsStatus(
        ownerPublicKey.toBase58(),
        selectedNfts,
        "stake",
      );

      if (!response.success) {
        console.error(response.message);
        return toast.error("Transaction failed. Please try again", {
          id: "tx",
        });
      }
      toast.success("Transaction successfully confirmed", { id: "tx" });

      console.log("Transaction successful: ", explorerUrl(signature));

      await refreshNfts();
      setSelected(TABS[1]);
    } catch (error) {
      if (error instanceof Error) {
        console.error(error);
        toast.error(error.message, { id: "tx" });
      } else {
        console.error("An unknown error occurred: ", error);
        toast.error("An unknown error occurred", { id: "tx" });
      }
    } finally {
      setIsLoading(false);
      setSelectedNfts([]);
    }
  }, [ownerPublicKey, connection, selectedNfts, sendTransaction]);

  const handleUnstaking = useCallback(async () => {
    if (!ownerPublicKey || !connection) {
      console.error("Missing public key or connection");
      return;
    }

    if (!toUnstakeNfts || toUnstakeNfts.length === 0) {
      console.log("No NFTs selected or provided for unstaking");
      return;
    }

    setIsLoading(true);

    try {
      if (!authorityKeypair) {
        throw new Error("No authority key found");
      }

      // for (const nft of toUnstakeNfts) {
      //   const mint = new PublicKey(nft.mint);
      //   const ata = await getAssociatedTokenAddress(mint, ownerPublicKey);
      //   const info = await getAccountInfo(connection, new PublicKey(ata));
      //   console.log({ mint: info.mint.toBase58(), isFrozen: info.isFrozen });
      // }

      const buildingTxResponse = await buildUnstakeTransaction(
        ownerPublicKey.toBase58(),
        toUnstakeNfts,
      );

      if (!buildingTxResponse.success) {
        toast.error(
          buildingTxResponse?.message || "Error while building transaction",
        );
        throw new Error("Failed to build unstake transaction");
      }

      const transactionBase64 = buildingTxResponse.data?.transaction;

      const transaction = Transaction.from(
        Buffer.from(transactionBase64, "base64"),
      );

      toast.loading("Sending Transaction", { id: "tx" });
      const latestBlockhash = await connection.getLatestBlockhash("finalized");

      const messageV0 = new TransactionMessage({
        recentBlockhash: latestBlockhash.blockhash,
        instructions: transaction.instructions,
        payerKey: ownerPublicKey,
      }).compileToV0Message();

      const versionedTransaction = new VersionedTransaction(messageV0);

      const simulationResult =
        await connection.simulateTransaction(versionedTransaction);
      if (simulationResult.value.err) {
        console.error(
          "Trnsaction simulation failed: ",
          simulationResult.value.logs,
        );
        toast.error("Trnsaction simulation failed", { id: "tx" });
        return;
      }

      const signature = await sendTransaction(
        versionedTransaction,
        connection,
        {
          signers: [authorityKeypair],
        },
      );

      const confirmation = await connection.confirmTransaction({
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        signature,
      });

      if (confirmation.value.err) {
        toast.error("Transaction confirmation failed", { id: "tx" });
        throw new Error("Transaction confirmation failed");
      }

      const response = await updateNftsStatus(
        ownerPublicKey.toBase58(),
        toUnstakeNfts,
        "unstake",
      );

      if (!response.success) {
        console.error(response.message);
        toast.error("Transaction failed. Please try again", {
          id: "tx",
        });
        return;
      }
      toast.success("Transaction successfully confirmed", { id: "tx" });

      console.log("Transaction successful: ", explorerUrl(signature));

      await refreshNfts();
    } catch (error) {
      if (error instanceof Error) {
        console.error(error);
        toast.error(error.message, { id: "tx" });
      } else {
        console.error("An unknown error occurred: ", error);
        toast.error("An unknown error occurred", { id: "tx" });
      }
    } finally {
      setIsLoading(false);
      setToUnstakeNfts([]);
      toast.dismiss("tx");
    }
  }, [ownerPublicKey, connection, toUnstakeNfts, sendTransaction]);

  const handleSelectNft = useCallback(
    (
      selectedNft: Nft,
      setStateArray: React.Dispatch<React.SetStateAction<Nft[]>>,
    ) => {
      setStateArray((prevState) =>
        prevState.includes(selectedNft)
          ? prevState.filter((nft) => nft !== selectedNft)
          : [...prevState, selectedNft],
      );
    },
    [],
  );

  useEffect(() => {
    if (response?.success) {
      setStakedNfts(response.data?.stakedNfts ?? []);
      setUnstakedNfts(response.data?.unstakedNfts ?? []);
    }
  }, [response]);

  return (
    <>
      <section className="flex flex-col items-center justify-center gap-4">
        <h1 className="gradient-effect text-center text-4xl leading-[1.4]">
          Staking
        </h1>
        <div className="flex flex-wrap items-center gap-5">
          {TABS.map((tab) => (
            <Tab
              text={tab}
              selected={selected === tab}
              setSelected={setSelected}
              key={tab}
              count={
                tab === "Staked NFTs" && !!stakedNfts.length
                  ? `(${stakedNfts.length})`
                  : undefined
              }
            />
          ))}
        </div>
      </section>
      {selected.toLowerCase() === "owned nfts" ? (
        <OwnedNfts
          unstakedNfts={unstakedNfts}
          selectedNfts={selectedNfts}
          setSelectedNfts={setSelectedNfts}
          isLoading={isLoading}
          handleStaking={handleStaking}
          fetchLoading={loading}
          isError={isError}
          handleSelectNft={handleSelectNft}
        />
      ) : selected.toLowerCase() === "staked nfts" ? (
        <>
          <StakedNfts
            stakedNfts={stakedNfts}
            toUnstakeNfts={toUnstakeNfts}
            setToUnstakeNfts={setToUnstakeNfts}
            handleUnstaking={handleUnstaking}
            handleSelectNft={handleSelectNft}
            isLoading={isLoading}
            setSelectedTab={setSelected}
          />
        </>
      ) : null}

      <TokenBalance stakedNfts={stakedNfts} isLoading={isLoading} />
    </>
  );
};
