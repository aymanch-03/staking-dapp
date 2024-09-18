import { TABS } from "@/constants";
import { useAssets } from "@/hooks/useAssets";
import { wait } from "@/lib/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import OwnedNfts from "./OwnedNfts";
import StakedNfts from "./StakedNfts";
import { Tab } from "./ui/tabs";

type Props = {
  connection: Connection;
  publicKey: PublicKey;
};

export type NftMetadata = {
  name: string;
  symbol: string;
  uri: string;
  image: string;
};

export const NftsSection = ({ connection, publicKey }: Props) => {
  const [selected, setSelected] = useState<string>(TABS[0]);
  const { sendTransaction } = useWallet();
  const { data: nfts, isLoading: loading, isError } = useAssets(publicKey);
  const [selectedNfts, setSelectedNfts] = useState<NftMetadata[]>([]);
  const [stakedNfts, setStakedNfts] = useState<NftMetadata[]>([]);
  const [toUnstakeNfts, setToUnstakeNfts] = useState<NftMetadata[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleStaking = useCallback(async () => {
    if (!publicKey || !connection) {
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
      console.log("Processing the transaction...");

      const amountLamports = selectedNfts.length * 0.02 * LAMPORTS_PER_SOL;
      if (isNaN(amountLamports) || amountLamports <= 0) {
        throw new Error("Invalid amount of lamports calculated");
      }

      const recipientPublicKey = new PublicKey(
        "6UuP65JY2DYUVz3muVnELjo3Nfn76Rr5h4HvC8PeTpt8",
      );

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPublicKey,
          lamports: amountLamports,
        }),
      );

      const latestBlockhash = await connection.getLatestBlockhashAndContext();
      if (
        !latestBlockhash ||
        !latestBlockhash.value ||
        !latestBlockhash.context
      ) {
        throw new Error("Failed to fetch latest blockhash and context");
      }

      const {
        context: { slot: minContextSlot },
        value: { blockhash, lastValidBlockHeight },
      } = latestBlockhash;

      const signature = await sendTransaction(transaction, connection, {
        minContextSlot,
      });

      const confirmation = await toast.promise(
        connection.confirmTransaction({
          blockhash,
          lastValidBlockHeight,
          signature,
        }),
        {
          loading: "Processing your transaction...",
          success: <b>Transaction confirmed successfully!</b>,
          error: <b>Transaction failed. Please try again.</b>,
        },
      );

      if (confirmation.value.err) {
        throw new Error("Transaction failed");
      }

      console.log("Transaction successful: ", signature);

      setStakedNfts((prevStaked) => [...prevStaked, ...selectedNfts]);
      setSelectedNfts([]);
      setSelected(TABS[1]);
    } catch (error) {
      const message = "Unable to complete action. Please retry.";
      toast.error(message);
      console.error("Error while staking NFTs: ", error);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, selectedNfts, sendTransaction]);

  const handleUnstaking = useCallback(async () => {
    if (!publicKey || !connection) {
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
      console.log("Processing the unstaking transaction...");

      const amountLamports = toUnstakeNfts.length * 0.02 * LAMPORTS_PER_SOL;
      if (isNaN(amountLamports) || amountLamports <= 0) {
        throw new Error("Invalid amount of lamports calculated for unstaking");
      }

      const recipientPublicKey = new PublicKey(
        "6UuP65JY2DYUVz3muVnELjo3Nfn76Rr5h4HvC8PeTpt8",
      );

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPublicKey,
          lamports: amountLamports,
        }),
      );

      const latestBlockhash = await connection.getLatestBlockhashAndContext();
      if (
        !latestBlockhash ||
        !latestBlockhash.value ||
        !latestBlockhash.context
      ) {
        throw new Error("Failed to fetch latest blockhash and context");
      }

      const {
        context: { slot: minContextSlot },
        value: { blockhash, lastValidBlockHeight },
      } = latestBlockhash;

      const signature = await sendTransaction(transaction, connection, {
        minContextSlot,
      });

      const confirmation = await toast.promise(
        connection.confirmTransaction({
          blockhash,
          lastValidBlockHeight,
          signature,
        }),
        {
          loading: "Processing your transaction...",
          success: <b>Transaction confirmed successfully!</b>,
          error: <b>Transaction failed. Please try again.</b>,
        },
      );

      if (confirmation.value.err) {
        throw new Error("Transaction failed");
      }

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
  }, [connection, publicKey, sendTransaction, toUnstakeNfts]);

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
