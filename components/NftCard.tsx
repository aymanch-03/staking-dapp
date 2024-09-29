import { cn } from "@/lib/utils";
import { NftMetadata } from "@/types";
import { motion } from "framer-motion";
import { Check } from "lucide-react";


type Props = {
  nft: NftMetadata;
  selectedNfts: NftMetadata[];
  handleSelectNft: (nft: NftMetadata) => void;
  index?: number;
};

export const NftCard = ({
  nft,
  handleSelectNft,
  selectedNfts,
  index,
}: Props) => {
  const isSelected = selectedNfts.includes(nft);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "spring", delay: (index ?? 1) * 0.1, duration: 0.3 }}
      onClick={() => handleSelectNft(nft)}
      key={nft.name}
      className={cn(
        "group relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-cover bg-center bg-no-repeat shadow-lg outline outline-primary/10 transition-all ease-linear hover:-translate-y-1",
        isSelected && "outline-2 outline-primary",
      )}
      style={{ backgroundImage: `url(${nft.image})` }}
    >
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
