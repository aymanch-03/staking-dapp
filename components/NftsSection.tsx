import { TABS } from "@/constants";
import { useAssets } from "@/hooks/useAssets";
import { explorerUrl } from "@/lib/helpers";
import { authorityKeypair, wait } from "@/lib/utils";
import { NftMetadata } from "@/types";
import {
  createAssociatedTokenAccountInstruction,
  createFreezeAccountInstruction,
  createThawAccountInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import OwnedNfts from "./OwnedNfts";
import StakedNfts from "./StakedNfts";
import { Tab } from "./ui/tabs";

type Props = {
  connection: Connection;
  ownerPublicKey: PublicKey;
};

export const NftsSection = ({ connection, ownerPublicKey }: Props) => {
  const [selected, setSelected] = useState<string>(TABS[0]);
  const { sendTransaction } = useWallet();
  const { data: nfts, isLoading: loading, isError } = useAssets(ownerPublicKey);
  const [selectedNfts, setSelectedNfts] = useState<NftMetadata[]>([]);
  const [stakedNfts, setStakedNfts] = useState<NftMetadata[]>([]);
  const [toUnstakeNfts, setToUnstakeNfts] = useState<NftMetadata[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      if (nfts) {
        for (const nft of nfts) {
          const mintPubKey = new PublicKey(nft.mint);
          const ata = await getAssociatedTokenAddress(
            mintPubKey,
            ownerPublicKey,
          );

          if (ata) {
            const { isFrozen } = await getAccount(connection, ata);

            if (isFrozen) {
              setStakedNfts((prev) => {
                if (!prev.some((stakedNft) => stakedNft.mint === nft.mint)) {
                  return [...prev, nft];
                }
                return prev;
              });
              console.log(`is ${nft.name} staked? `, isFrozen);
            }
          }
        }
      }
    };

    fetchAccounts();
  }, [connection, nfts, ownerPublicKey]);

  const handleStaking = useCallback(async () => {
    const buildStakeAndFreezeTransaction = async (
      selectedNfts: NftMetadata[],
    ): Promise<VersionedTransaction> => {
      const instructions = [];
      for (const nft of selectedNfts) {
        const mintPubKey = new PublicKey(nft.mint);
        const associatedTokenAccount = await getAssociatedTokenAddress(
          mintPubKey,
          ownerPublicKey,
        );
        const accountInfo = await getAccount(
          connection,
          associatedTokenAccount,
        );

        if (!accountInfo) {
          const ix = createAssociatedTokenAccountInstruction(
            ownerPublicKey,
            associatedTokenAccount,
            ownerPublicKey,
            mintPubKey,
          );
          instructions.push(ix);
        }
        const freezeIx = createFreezeAccountInstruction(
          associatedTokenAccount,
          new PublicKey(nft.mint),
          authorityKeypair.publicKey,
          [],
        );
        instructions.push(freezeIx);
      }

      const latestBlockhash = await connection.getLatestBlockhash();
      const messageV0 = new TransactionMessage({
        payerKey: ownerPublicKey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions,
      }).compileToV0Message();

      return new VersionedTransaction(messageV0);
    };

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
      await wait(1500);

      if (!authorityKeypair) {
        throw new Error("No authority key found");
      }

      console.log("Building transaction...");
      const transaction = await buildStakeAndFreezeTransaction(selectedNfts);

      const simulationResult =
        await connection.simulateTransaction(transaction);
      if (simulationResult.value.err) {
        throw new Error("Transaction simulation failed");
      }

      console.log("Sending transaction...");
      const signature = await sendTransaction(transaction, connection, {
        signers: [authorityKeypair],
      });

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

      setStakedNfts((prevStaked) => [...prevStaked, ...selectedNfts]);
      setSelectedNfts([]);
      setSelected(TABS[1]);
    } catch (error) {
      console.error("Error during staking:", error);
      toast.error("Unable to complete action. Please retry.");
    } finally {
      setIsLoading(false);
    }
  }, [ownerPublicKey, connection, selectedNfts, sendTransaction]);

  const handleUnstaking = useCallback(async () => {
    const buildUnstakeAndThawTransaction = async (
      selectedNfts: NftMetadata[],
    ): Promise<VersionedTransaction> => {
      const instructions = [];
      for (const nft of selectedNfts) {
        const mintPubKey = new PublicKey(nft.mint);
        const associatedTokenAccount = await getAssociatedTokenAddress(
          mintPubKey,
          ownerPublicKey,
        );
        const accountInfo = await getAccount(
          connection,
          associatedTokenAccount,
        );

        if (!accountInfo) {
          const ix = createAssociatedTokenAccountInstruction(
            ownerPublicKey,
            associatedTokenAccount,
            ownerPublicKey,
            mintPubKey,
          );
          instructions.push(ix);
        }
        const freezeIx = createThawAccountInstruction(
          associatedTokenAccount,
          new PublicKey(nft.mint),
          authorityKeypair.publicKey,
          [],
        );
        instructions.push(freezeIx);
      }

      const latestBlockhash = await connection.getLatestBlockhash();
      const messageV0 = new TransactionMessage({
        payerKey: ownerPublicKey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions,
      }).compileToV0Message();

      return new VersionedTransaction(messageV0);
    };
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
      await wait(1500);

      if (!authorityKeypair) {
        throw new Error("No authority key found");
      }

      console.log("Building transaction...");
      const transaction = await buildUnstakeAndThawTransaction(toUnstakeNfts);

      const simulationResult =
        await connection.simulateTransaction(transaction);
      if (simulationResult.value.err) {
        throw new Error("Transaction simulation failed");
      }

      console.log("Sending transaction...");
      const signature = await sendTransaction(transaction, connection, {
        signers: [authorityKeypair],
      });

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

      setStakedNfts((prevStaked) => {
        return prevStaked.filter((nft) => !toUnstakeNfts.includes(nft));
      });
      setToUnstakeNfts([]);
    } catch (error) {
      const message = "Unable to complete action. Please retry.";
      toast.error(message);
      console.error("Error while unstaking NFTs: ", error);
    } finally {
      setIsLoading(false);
    }
  }, [connection, ownerPublicKey, sendTransaction, toUnstakeNfts]);

  const handleSelectNft = useCallback(
    (
      selectedNft: NftMetadata,
      setStateArray: React.Dispatch<React.SetStateAction<NftMetadata[]>>,
    ) => {
      setStateArray((prevState) =>
        prevState.includes(selectedNft)
          ? prevState.filter((nft) => nft !== selectedNft)
          : [...prevState, selectedNft],
      );
    },
    [],
  );

  const isNftStaked = useMemo(() => {
    return (nft: NftMetadata) => stakedNfts.includes(nft);
  }, [stakedNfts]);

  return (
    <>
      <section className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-center text-4xl">Staking</h1>
        <div className="mb-8 flex flex-wrap items-center gap-5">
          {TABS.map((tab) => (
            <Tab
              text={tab}
              selected={selected === tab}
              setSelected={setSelected}
              key={tab}
            />
          ))}
        </div>
      </section>
      {selected.toLowerCase() === "owned nfts" ? (
        <OwnedNfts
          allNfts={nfts ?? []}
          selectedNfts={selectedNfts}
          setSelectedNfts={setSelectedNfts}
          isLoading={isLoading}
          handleStaking={handleStaking}
          fetchLoading={loading}
          isError={isError}
          isNftStaked={isNftStaked}
          handleSelectNft={handleSelectNft}
        />
      ) : selected.toLowerCase() === "staked nfts" ? (
        <StakedNfts
          isLoading={isLoading}
          toUnstakeNfts={toUnstakeNfts}
          stakedNfts={stakedNfts}
          setToUnstakeNfts={setToUnstakeNfts}
          handleUnstaking={handleUnstaking}
          handleSelectNft={handleSelectNft}
          setSelectedTab={setSelected}
        />
      ) : null}
    </>
  );
};
