import { NftsSection } from "@/components/NftsSection";
import { Lamp } from "@/components/ui/lamp";
import { TextEffect } from "@/ui/text-effect";
import { Connection, PublicKey } from "@solana/web3.js";

type Props = {
  connection: Connection;
  publicKey: PublicKey | null;
};

const Section = ({ connection, publicKey }: Props) => {
  return connection && publicKey ? (
    <div className="container py-10">
      <NftsSection connection={connection} ownerPublicKey={publicKey} />
      <TextEffect label="Staking" />
    </div>
  ) : (
    <Lamp />
  );
};

export default Section;
