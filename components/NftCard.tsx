import { cn } from "@/lib/utils";
import { Nft } from "@prisma/client";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Image from "next/image";

type Props = {
  nft: Nft;
  selectedNfts: Nft[];
  handleSelectNft: (nft: Nft) => void;
  isLoading: boolean;
  index?: number;
};

export const NftCard = ({
  nft,
  handleSelectNft,
  selectedNfts,
  index,
  isLoading,
}: Props) => {
  const isSelected = selectedNfts.includes(nft);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "spring", delay: (index ?? 1) * 0.1, duration: 0.3 }}
      onClick={() => {
        if (isLoading) return;
        handleSelectNft(nft);
      }}
      key={index}
      className={cn(
        "group relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-cover bg-center bg-no-repeat shadow-lg outline outline-primary/10 transition-all ease-linear hover:-translate-y-1",
        isSelected && "outline-2 outline-primary",
        isLoading && "cursor-not-allowed",
      )}
    >
      <Image
        src={nft.image}
        alt={nft.name}
        fill
        sizes="100%"
        className="object-cover"
        priority
      />
      <div className="absolute bottom-0 flex h-1/2 w-full flex-col justify-end bg-gradient-to-t from-black/80 to-transparent p-4">
        <h3 className="text-xl font-semibold text-gray-100">{nft.name}</h3>
        <p className="text-sm text-gray-400">{nft.symbol}</p>
      </div>
      {isSelected && (
        <div
          className={cn(
            "absolute right-3 top-3 rounded-full bg-black p-1 transition-all",
          )}
        >
          <Check strokeWidth={4} className="size-4 text-white" />
        </div>
      )}
    </motion.div>
  );
};
