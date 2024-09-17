import Solana from "@/app/public/solana-logo.svg";
import MainButton from "@/components/ui/primary-button";
import { Connection, PublicKey } from "@solana/web3.js";
import dynamic from "next/dynamic";
import Image from "next/image";
const Wallets = dynamic(() => import("./Wallets"), { ssr: false });

type HeaderProps = {
  balance: number;
  connection: Connection;
  publicKey: PublicKey | null;
};
const Header = ({ balance, connection, publicKey }: HeaderProps) => {
  return (
    <div className="container flex h-20 w-full items-center justify-between">
      <div className="w-32">
        {/* <Image src={biplesLogo} alt="Biples" className="select-none" /> */}
        <span className="font-semibold">LOGO</span>
      </div>
      <div className="flex items-stretch gap-2">
        {connection && publicKey && (
          <MainButton
            text={`Balance: ${balance.toFixed(5)} SOL`}
            className="w-fit whitespace-nowrap"
            Icon={<Image src={Solana} width={15} alt="Solana" />}
          />
        )}
        <Wallets />
      </div>
    </div>
  );
};

export default Header;
