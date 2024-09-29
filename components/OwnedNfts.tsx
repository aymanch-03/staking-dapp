import { NftMetadata } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  GalleryHorizontal,
  Info,
  LoaderCircle,
  X,
} from "lucide-react";
import React from "react";
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
  allNfts: NftMetadata[];
  selectedNfts: NftMetadata[];
  setSelectedNfts: React.Dispatch<React.SetStateAction<NftMetadata[]>>;
  isLoading: boolean;
  handleStaking: () => void;
  fetchLoading: boolean;
  isError: boolean;
  isNftStaked: (nft: NftMetadata) => boolean;
  handleSelectNft: (
    nft: NftMetadata,
    setter: React.Dispatch<React.SetStateAction<NftMetadata[]>>,
  ) => void;
};

const OwnedNfts = ({
  allNfts,
  selectedNfts,
  setSelectedNfts,
  isLoading,
  handleStaking,
  fetchLoading,
  isError,
  isNftStaked,
  handleSelectNft,
}: Props) => {
  return (
    <section className="my-3 space-y-5">
      <div className="flex h-10 items-center justify-between">
        <div className="flex items-center gap-2 text-xl md:text-2xl">
          <span>Owned NFTs</span>
          <TooltipProvider>
            <Tooltip delayDuration={250}>
              <TooltipTrigger asChild>
                <Info className="size-5 cursor-pointer pt-1 text-white" />
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-white text-black">
                <p>
                  Staked NFTs will not appear in your collection of owned NFTs
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {selectedNfts.length && selectedNfts.length > 0 ? (
          <AnimatePresence>
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
                onClick={() => setSelectedNfts([])}
                className="border bg-black/80 hover:bg-black"
                disabled={
                  isLoading ||
                  (!selectedNfts.length && selectedNfts.length <= 0)
                }
              >
                Reset Selection
              </Button>
              <Button
                variant={"expandIcon"}
                Icon={ArrowRight}
                iconPlacement="right"
                className="border bg-primary/45 hover:bg-primary/50"
                disabled={
                  isLoading || !selectedNfts.length || selectedNfts.length <= 0
                }
                onClick={handleStaking}
              >
                Stake NFTs ({selectedNfts.length})
                {isLoading && (
                  <LoaderCircle className="ml-2 size-4 animate-spin" />
                )}
              </Button>
            </motion.div>
          </AnimatePresence>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-6 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <AnimatePresence>
          {fetchLoading || isError ? (
            <>
              <Skeleton className="aspect-square rounded-xl bg-neutral-900/60 dark:bg-neutral-50/60" />
              <Skeleton className="aspect-square rounded-xl bg-neutral-900/60 dark:bg-neutral-50/60" />
              <Skeleton className="aspect-square rounded-xl bg-neutral-900/60 dark:bg-neutral-50/60" />
              <Skeleton className="aspect-square rounded-xl bg-neutral-900/60 dark:bg-neutral-50/60" />
              <Skeleton className="aspect-square rounded-xl bg-neutral-900/60 dark:bg-neutral-50/60" />
            </>
          ) : allNfts &&
            allNfts.filter((nft) => !isNftStaked(nft)).length > 0 ? (
            allNfts
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
            <div className="col-span-full flex min-h-[186px] flex-col items-center justify-center gap-3 text-center">
              <GalleryHorizontal strokeWidth={1} className="size-16" />

              <div className="flex items-center gap-2">
                <span>You {"don't"} have any NFTs in your collection</span>
                <TooltipProvider>
                  <Tooltip delayDuration={250}>
                    <TooltipTrigger asChild>
                      <Info className="size-5 cursor-pointer pt-1 text-white" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-white text-black">
                      <p>
                        Staked NFTs will not appear in your collection of owned
                        NFTs
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

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
  );
};

export default OwnedNfts;
