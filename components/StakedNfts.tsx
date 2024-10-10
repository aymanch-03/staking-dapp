import { NftCard } from "@/components/NftCard";
import { TABS } from "@/constants";
import { Button } from "@/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/tooltip";
import { Nft } from "@prisma/client";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  GalleryHorizontal,
  Info,
  LoaderCircle,
  X,
} from "lucide-react";
import React from "react";

type Props = {
  toUnstakeNfts: Nft[];
  stakedNfts: Nft[];
  setToUnstakeNfts: React.Dispatch<React.SetStateAction<Nft[]>>;
  isLoading: boolean;
  handleUnstaking: () => void;
  handleSelectNft: (
    nft: Nft,
    setter: React.Dispatch<React.SetStateAction<Nft[]>>,
  ) => void;
  setSelectedTab: React.Dispatch<React.SetStateAction<string>>;
};

const StakedNfts = ({
  toUnstakeNfts,
  setToUnstakeNfts,
  handleUnstaking,
  isLoading,
  stakedNfts,
  handleSelectNft,
  setSelectedTab,
}: Props) => {
  return (
    <section className="my-3 space-y-5">
      <div className="flex h-10 items-center justify-between">
        <div className="flex items-center gap-2 text-xl md:text-2xl">
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
              onClick={() => setToUnstakeNfts([])}
              className="border bg-black/80 hover:bg-black"
              disabled={
                isLoading || !toUnstakeNfts.length || toUnstakeNfts.length <= 0
              }
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
                isLoading || !toUnstakeNfts.length || toUnstakeNfts.length <= 0
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
              isStaked={nft.isStaked}
              isLoading={isLoading}
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
        <section className="col-span-full flex min-h-[186px] flex-col items-center justify-center gap-3 text-center">
          <GalleryHorizontal strokeWidth={1} className="size-16" />
          <p className="w-full text-center">No staked NFTs at the moment</p>
          <Button
            variant={"expandIcon"}
            Icon={ArrowLeft}
            onClick={() => setSelectedTab(TABS[0])}
            iconPlacement="left"
            className="rounded-full border border-none bg-primary/45 hover:bg-primary/50"
          >
            Stake your NFTs
          </Button>
        </section>
      )}
    </section>
  );
};

export default StakedNfts;
