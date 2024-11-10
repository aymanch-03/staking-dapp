import { Button } from "@/ui/button";
import { WalletIcon } from "@/ui/wallet-icon";
import { WalletName } from "@solana/wallet-adapter-base";
import { Wallet } from "@solana/wallet-adapter-react";
import Link from "next/link";

type WalletListProps = {
  wallets: Wallet[];
  onSelect: (name: WalletName) => void;
  type: "installed" | "uninstalled";
};

export const WalletList = ({ wallets, onSelect, type }: WalletListProps) => {
  if (type === "installed") {
    return (
      <div className="grid grid-cols-2 gap-3 xs:grid-cols-3 sm:grid-cols-4">
        {wallets.length > 0 ? (
          wallets.map((wallet) => (
            <Button
              variant="ghost"
              key={wallet.adapter.name}
              onClick={() => onSelect(wallet.adapter.name)}
              className="flex aspect-square h-auto cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-primary/10 transition hover:border-primary/60 hover:bg-primary/20"
            >
              <WalletIcon wallet={wallet} size="md" />
              <span className="text-sm text-background">
                {wallet.adapter.name}
              </span>
            </Button>
          ))
        ) : (
          <p className="text-muted-background col-span-full text-center text-sm">
            No wallet found. Please download a supported Solana wallet.
          </p>
        )}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {wallets.map((wallet) => (
        <Link
          key={wallet.adapter.name}
          href={wallet.adapter.url}
          target="_blank"
          className="flex w-full items-center gap-2 rounded-md border border-primary/10 p-3 transition-all hover:border-primary/60 hover:bg-primary/20"
        >
          <WalletIcon size="md" wallet={wallet} />
          <span className="font-medium text-background">
            {wallet.adapter.name}
          </span>
        </Link>
      ))}
    </div>
  );
};
