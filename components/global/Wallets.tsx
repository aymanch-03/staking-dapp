import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";

import { BadgeInfo, Check, LogOut } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MainButton from "@/components/ui/primary-button";
import { WalletName } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  Credenza,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "../ui/modal";

const WalletsModal = () => {
  const { select, publicKey, disconnect, connect, wallet, wallets } =
    useWallet();
  const [isDisabled, setIsDisabled] = useState(false);
  const [isDeconnecting, setIsDeconnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const truncate = `${publicKey?.toBase58().slice(0, 5)}...${publicKey
    ?.toString()
    .slice(-5)}`;

  const connectWallet = async (walletName: WalletName) => {
    setIsDisabled(true);
    try {
      await select(walletName);
      await connect();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsDisabled(false);
    }
  };

  const base58 = useMemo(() => publicKey?.toBase58(), [publicKey]);
  const copyAddress = useCallback(async () => {
    if (base58) {
      await navigator.clipboard.writeText(base58);
      setCopied(true);
      setTimeout(() => setCopied(false), 800);
    }
  }, [base58]);

  const disconnectWallet = useCallback(async () => {
    setIsDeconnecting(true);
    await disconnect();
    setIsDeconnecting(false);
  }, [disconnect]);

  const installedWallets = useMemo(
    () => wallets?.filter((wallet) => wallet.readyState === "Installed"),
    [wallets],
  );
  const uninstalledWallets = useMemo(
    () => wallets?.filter((wallet) => wallet.readyState !== "Installed"),
    [wallets],
  );
  return !publicKey ? (
    <Credenza>
      <CredenzaTrigger asChild>
        <MainButton text="Connect Wallet" />
      </CredenzaTrigger>
      <CredenzaContent className="h-fit gap-0 border-primary/20 bg-[#222]/20 p-0 text-white backdrop-blur-lg">
        <CredenzaHeader className="border-b border-primary/20 p-5">
          <CredenzaTitle className="font-medium">Connect Wallet</CredenzaTitle>
          <CredenzaDescription>
            You need to connect a Solana wallet.
          </CredenzaDescription>
        </CredenzaHeader>
        <div className="space-y-4 p-5">
          <h1 className="text-sm font-medium">Installed Wallets</h1>
          <div className="grid grid-cols-2 gap-3 xs:grid-cols-3 sm:grid-cols-4">
            {installedWallets.length > 0 ? (
              installedWallets.map((wallet) => (
                <button
                  key={wallet.adapter.name}
                  disabled={isDisabled}
                  onClick={() => connectWallet(wallet.adapter.name)}
                  className="flex aspect-square flex-col items-center justify-center gap-2 rounded-md border border-primary/10 transition-all hover:border-primary/60 hover:bg-primary/20 hover:shadow-[0_0_30px_10px_rgba(83,250,251,0.1)]"
                >
                  <Image
                    src={wallet.adapter.icon}
                    alt={wallet.adapter.name}
                    width={26}
                    height={26}
                  />
                  <span className="text-sm">{wallet.adapter.name}</span>
                </button>
              ))
            ) : (
              <p className="col-span-full text-center text-sm text-white/80">
                No wallet found. Please download a supported Solana wallet.
              </p>
            )}
          </div>
          <Accordion type="single" collapsible>
            <AccordionItem value="moreWallets" className="border-0">
              <AccordionTrigger className="normal text-sm font-medium">
                More Wallets
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-0">
                {/* <div className="flex flex-col gap-3 overflow-auto max-h-[150px]"> */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {uninstalledWallets?.length > 0 &&
                    uninstalledWallets?.map((wallet) => (
                      <div key={wallet.adapter.name}>
                        <Link
                          href={wallet.adapter.url}
                          target="_blank"
                          className="flex w-full items-center gap-2 rounded-md border border-primary/10 p-3 transition-all hover:border-primary/60 hover:bg-primary/20"
                        >
                          <Image
                            src={wallet.adapter.icon}
                            alt={wallet.adapter.name}
                            width={26}
                            height={26}
                          />
                          <span>{wallet.adapter.name}</span>
                        </Link>
                      </div>
                    ))}
                </div>
                <p className="flex items-center justify-center gap-2 py-3 text-xs text-white/60">
                  <BadgeInfo className="size-4" />
                  <span>
                    If you face errors, install the wallet before connecting.
                  </span>
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </CredenzaContent>
    </Credenza>
  ) : (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none ring-0">
        <MainButton
          onClick={disconnectWallet}
          text={isDeconnecting ? "Disconnecting..." : truncate}
          disabled={isDeconnecting}
          Icon={
            isDeconnecting ? undefined : (
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
      </DropdownMenuTrigger>
      <DropdownMenuContent className="rounded-lg border border-primary bg-primary/10">
        <div
          onClick={() => copyAddress()}
          className="cursor-pointer justify-center rounded-md px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary/20"
        >
          <motion.span
            className="flex items-center justify-center gap-1"
            key={copied ? "copied" : "copy"}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ duration: 0.1 }}
          >
            {copied ? (
              <>
                Copied
                <Check size={15} className="text-xs" />
              </>
            ) : (
              "Copy Address"
            )}
          </motion.span>
        </div>
        <DropdownMenuItem
          onClick={disconnectWallet}
          className="cursor-pointer justify-center rounded-md px-4 py-2 text-center font-medium !text-white hover:!bg-primary/20"
        >
          <motion.span
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ duration: 0.1 }}
            className="flex items-center justify-center gap-1.5"
          >
            <LogOut size={15} className="text-xs" />
            <span>Disconnect</span>
          </motion.span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WalletsModal;
