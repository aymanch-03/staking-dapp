import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import MainButton from "@/components/ui/primary-button";
import { useGetBalance } from "@/hooks/useGetBalance";
import { Button } from "@/ui/button";
import {
  Credenza,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@/ui/modal";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { WalletName } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { BadgeInfo, Check, Copy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

const WalletsModal = () => {
  const { select, publicKey, disconnect, connect, wallet, wallets } =
    useWallet();
  const [openConnectModal, setOpenConnectModal] = useState(false);
  const [openWalletModal, setOpenWalletModal] = useState(false);
  const { connection } = useConnection();
  const balance = useGetBalance(publicKey, connection);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const truncate = useMemo(() => {
    if (!publicKey) return "";
    const base58 = publicKey.toBase58();
    return `${base58.slice(0, 5)}•••${base58.slice(-5)}`;
  }, [publicKey]);

  const base58 = useMemo(() => publicKey?.toBase58(), [publicKey]);

  const handleWalletAction = async (action: () => Promise<void>) => {
    setIsLoading(true);
    try {
      await action();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = useCallback(
    (walletName: WalletName) => {
      handleWalletAction(async () => {
        await select(walletName);
        await connect();
      });
    },
    [select, connect],
  );

  const disconnectWallet = useCallback(() => {
    handleWalletAction(disconnect);
  }, [disconnect]);

  const copyAddress = useCallback(async () => {
    if (base58) {
      await navigator.clipboard.writeText(base58);
      setCopied(true);
      setTimeout(() => setCopied(false), 800);
    }
  }, [base58]);

  const installedWallets = useMemo(
    () => wallets?.filter((wallet) => wallet.readyState === "Installed"),
    [wallets],
  );
  const uninstalledWallets = useMemo(
    () => wallets?.filter((wallet) => wallet.readyState !== "Installed"),
    [wallets],
  );
  return !publicKey ? (
    <Credenza open={openConnectModal} onOpenChange={setOpenConnectModal}>
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
                  disabled={isLoading}
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
    <Credenza open={openWalletModal} onOpenChange={setOpenWalletModal}>
      <CredenzaTrigger className="outline-none ring-0">
        <MainButton
          text={isLoading ? "Connecting..." : truncate}
          disabled={isLoading}
          Icon={
            isLoading ? undefined : (
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
      <CredenzaContent className="flex max-h-[370px] flex-col justify-between gap-0 border-primary/20 bg-[#222]/20 text-white backdrop-blur-lg md:aspect-square md:max-w-[370px]">
        <VisuallyHidden>
          <CredenzaTitle>Connection Modal</CredenzaTitle>
          <CredenzaDescription>Connection Modal</CredenzaDescription>
        </VisuallyHidden>
        <CredenzaHeader className="w-full !text-center text-xl">
          {wallet?.adapter.name}
        </CredenzaHeader>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
          <div className="flex flex-col items-center gap-2">
            <Image
              src={wallet?.adapter.icon as string}
              alt={"Wallet"}
              width={70}
              height={70}
              loading="lazy"
            />
            {/* <span className="text-lg font-semibold text-white">
              {wallet?.adapter.name}
            </span> */}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl tracking-wider text-white">
              {truncate}
            </span>
            <button
              onClick={copyAddress}
              className="flex items-center gap-1 text-sm text-white/40 transition-all hover:text-white/80"
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </button>
          </div>
          <p className="text-base text-white/50">{balance} SOL</p>
        </div>
        <div className="max-md:p-4">
          <Button
            className="w-full border-none bg-primary/45 py-[22px] text-base hover:bg-primary/50"
            onClick={() => {
              disconnectWallet();
              setOpenWalletModal(false);
            }}
            disabled={isLoading}
          >
            {isLoading ? "Disconnecting..." : "Disconnect Wallet"}
          </Button>
        </div>
      </CredenzaContent>
    </Credenza>
  );
};

export default WalletsModal;
