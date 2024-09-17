import { useAssets } from "@/hooks/useAssets";
import { wait } from "@/lib/utils";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Info, LoaderCircle, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { NftCard } from "./NftCard";
import { Button } from "./ui/button";
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
  const nfts = useAssets(publicKey);
  const [selectedNfts, setSelectedNfts] = useState<NftMetadata[]>([]);
  const [stakedNfts, setStakedNfts] = useState<NftMetadata[]>([]);
  const [toUnstakeNfts, setToUnstakeNfts] = useState<NftMetadata[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleStaking = useCallback(
    async (nftsToStake: NftMetadata[]) => {
      if (!publicKey || !connection) return;

      setIsLoading(true);
      try {
        await wait(1500);
        const newStakedNfts = nftsToStake.filter(
          (nft) => !stakedNfts.includes(nft),
        );

        if (newStakedNfts.length === 0) {
          console.log("All selected NFTs are already staked");
        } else {
          setStakedNfts((prevStaked) => [...prevStaked, ...newStakedNfts]);
        }

        setSelectedNfts([]);
      } catch (error) {
        console.error("Error while staking NFTs: ", error);
      } finally {
        setIsLoading(false);
      }
    },
    [publicKey, connection, stakedNfts],
  );

  const handleUnstaking = useCallback(async (nftsToUnstake: NftMetadata[]) => {
    if (!publicKey || !connection) return;

    setIsLoading(true);
    try {
      await wait(1500);
      const newToUnstakeNfts = nftsToUnstake.filter(
        (nft) => !toUnstakeNfts.includes(nft),
      );

      if (newToUnstakeNfts.length === 0) {
        console.log("All selected NFTs are already unstaked");
      } else {
        setStakedNfts((prevStaked) => {
          return [
            ...prevStaked.filter((nft) => !newToUnstakeNfts.includes(nft)),
          ];
        });
        setToUnstakeNfts([]);
      }
    } catch (error) {
      console.error("Error while Unstaking NFTs: ", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSelectNft = useCallback(
    (
      selectedNft: NftMetadata,
      stateArray: NftMetadata[],
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
                  onClick={() => handleStaking(selectedNfts)}
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
            {nfts.filter((nft) => !isNftStaked(nft)).length > 0 ? (
              nfts
                .filter((nft) => !isNftStaked(nft))
                .map((nft, index) => (
                  <NftCard
                    key={nft.name}
                    nft={nft}
                    index={index + 1}
                    selectedNfts={selectedNfts}
                    handleSelectNft={(selectedNft) =>
                      handleSelectNft(
                        selectedNft,
                        selectedNfts,
                        setSelectedNfts,
                      )
                    }
                  />
                ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center gap-2 text-center">
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
                onClick={() => handleUnstaking(toUnstakeNfts)}
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
                  handleSelectNft(selectedNft, toUnstakeNfts, setToUnstakeNfts)
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
