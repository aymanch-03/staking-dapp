import { WalletList } from "@/components/ui/wallets-list";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/ui/accordion";
import {
  Credenza,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@/ui/modal";
import { WalletName } from "@solana/wallet-adapter-base";
import { Wallet } from "@solana/wallet-adapter-react";
import { BadgeInfo } from "lucide-react";
import MainButton from "../ui/primary-button";

type WalletConnectModalProps = {
  installedWallets: Wallet[];
  uninstalledWallets: Wallet[];
  onConnect: (name: WalletName) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const WalletConnectModal = ({
  installedWallets,
  uninstalledWallets,
  onConnect,
  open,
  onOpenChange,
}: WalletConnectModalProps) => (
  <Credenza open={open} onOpenChange={onOpenChange}>
    <CredenzaTrigger asChild>
      <MainButton text="Connect Wallet" />
    </CredenzaTrigger>
    <CredenzaContent className="h-fit gap-0 border border-primary/20 bg-[#222]/20 p-0 backdrop-blur-lg">
      <CredenzaHeader className="border-b border-primary/20 p-5">
        <CredenzaTitle className="font-semibold text-background">
          Connect Wallet
        </CredenzaTitle>
        <CredenzaDescription className="text-muted-background font-medium">
          You need to connect a Solana wallet.
        </CredenzaDescription>
      </CredenzaHeader>
      <div className="space-y-4 p-5">
        <h1 className="text-sm font-medium text-background">
          Installed Wallets
        </h1>
        <WalletList
          wallets={installedWallets}
          onSelect={onConnect}
          type="installed"
        />
        <Accordion type="single" collapsible>
          <AccordionItem value="moreWallets" className="border-0">
            <AccordionTrigger className="normal text-sm font-medium text-background">
              More Wallets
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-0">
              <WalletList
                wallets={uninstalledWallets}
                onSelect={onConnect}
                type="uninstalled"
              />
              <p className="flex items-center justify-center gap-2 py-3 text-xs text-background">
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
);
