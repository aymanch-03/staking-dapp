import { cn, signIn } from "@/lib/utils";
import { Button } from "@/ui/button";
import {
  Credenza,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@/ui/modal";
import MainButton from "@/ui/primary-button";
import { WalletAddress } from "@/ui/wallet-address";
import { Wallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import Image from "next/image";
import { Dispatch, SetStateAction } from "react";

type ConnectedWalletModalProps = {
  wallet: Wallet;
  publicKey: PublicKey;
  balance: number;
  onDisconnect: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isConnecting: boolean;
  truncate: string;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  setOpenWalletModal: Dispatch<SetStateAction<boolean>>;
  status: string;
};

export const ConnectedWalletModal = ({
  wallet,
  publicKey,
  balance,
  onDisconnect,
  open,
  onOpenChange,
  isConnecting,
  truncate,
  signMessage,
  setOpenWalletModal,
  status,
}: ConnectedWalletModalProps) => (
  <Credenza open={open} onOpenChange={onOpenChange}>
    <CredenzaTrigger className="outline-none ring-0" asChild>
      <MainButton
        text={isConnecting ? "Connecting..." : truncate}
        disabled={isConnecting}
        Icon={
          isConnecting ? undefined : (
            <Image
              src={wallet?.adapter.icon as string}
              alt={"Wallet"}
              width={20}
              height={20}
              loading="lazy"
            />
          )
        }
      />
    </CredenzaTrigger>
    <CredenzaContent className="flex flex-col justify-between gap-0 !rounded-3xl border-border/20 bg-foreground text-background md:aspect-square md:max-w-[370px]">
      <CredenzaHeader className="w-full !text-center text-xl font-semibold">
        <CredenzaTitle>{wallet.adapter.name}</CredenzaTitle>
      </CredenzaHeader>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
        <div className="flex flex-col items-center gap-2">
          <Image
            src={wallet.adapter.icon}
            alt="Wallet"
            width={70}
            height={70}
            className={cn(
              wallet.adapter.name.toLowerCase() === "ledger"
                ? "invert dark:invert-0"
                : null,
            )}
            loading="lazy"
          />
        </div>
        <WalletAddress
          publicKey={publicKey}
          size="lg"
          className="mb-2"
          showCopyButton={true}
        />
        <p className="text-muted-background text-base font-semibold">
          {balance.toFixed(5)} SOL
        </p>
      </div>
      <div className="flex gap-2 max-md:p-4">
        <Button
          className="w-full border-none bg-primary/45 hover:bg-primary/50"
          onClick={onDisconnect}
        >
          Disconnect Wallet
        </Button>
        {status === "unauthenticated" && (
          <Button
            className="w-full border bg-transparent text-white transition-all hover:border-white/60 hover:bg-transparent hover:text-white/80"
            onClick={async () => {
              if (signMessage) {
                setOpenWalletModal(false);
                await signIn(publicKey, signMessage);
              }
            }}
            disabled={isConnecting}
          >
            {isConnecting ? "Disconnecting..." : "Sign Message"}
          </Button>
        )}
      </div>
    </CredenzaContent>
  </Credenza>
);
