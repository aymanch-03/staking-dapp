import { Lamp } from "@/components/ui/lamp";
import { Connection, PublicKey } from "@solana/web3.js";
import { NftsSection } from "../NftsSection";
import { SendSolForm } from "../sendSol";

type Props = {
  connection: Connection;
  publicKey: PublicKey | null;
};

const Section = ({ connection, publicKey }: Props) => {
  return connection && publicKey ? (
    <div className="container py-10">
      {/* <SendSolForm /> */}
      <NftsSection connection={connection} publicKey={publicKey} />
    </div>
  ) : (
    <Lamp />
  );
};

export default Section;
