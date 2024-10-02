import { Lamp } from "@/components/ui/lamp";
import { useAuthUser } from "@/hooks/useAuthUser";
import { Connection, PublicKey } from "@solana/web3.js";
import { Loader2 } from "lucide-react";
import { NftsSection } from "../NftsSection";

type Props = {
  connection: Connection;
  publicKey: PublicKey | null;
};

const Section = ({ connection, publicKey }: Props) => {
  const { data: authUser, isLoading } = useAuthUser(
    publicKey?.toString() ?? null,
  );

  return connection && publicKey && authUser ? (
    <div className="container py-10">
      <NftsSection connection={connection} ownerPublicKey={publicKey} />
    </div>
  ) : isLoading ? (
    <div className="flex h-[50vh] items-center justify-center">
      <Loader2 size={40} className="animate-spin text-white" />
    </div>
  ) : (
    <Lamp />
  );
};

export default Section;
