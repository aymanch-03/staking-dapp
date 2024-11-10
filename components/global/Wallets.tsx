import { ConnectedWalletModal } from "@/components/modals/ConnectedWalletModal";
import { WalletConnectModal } from "@/components/modals/WalletConnectModal";
import { useGetBalance } from "@/hooks/useGetBalance";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { WalletName } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { signOut, useSession } from "next-auth/react";
import { useMemo, useState } from "react";

export const ConnectionModal = () => {
  const { status } = useSession();
  const { publicKey, wallet, wallets, connected, signMessage } = useWallet();
  const [openConnectModal, setOpenConnectModal] = useState(false);
  const [openWalletModal, setOpenWalletModal] = useState(false);
  const { connection } = useConnection();
  const balance = useGetBalance(publicKey, connection);

  const truncate = useMemo(() => {
    if (!publicKey) return "";
    const base58 = publicKey.toBase58();
    return `${base58.slice(0, 5)}•••${base58.slice(-5)}`;
  }, [publicKey]);

  const { connectWallet, disconnectWallet, isConnecting } =
    useWalletConnection();

  const installedWallets = useMemo(
    () => wallets?.filter((wallet) => wallet.readyState === "Installed"),
    [wallets],
  );

  const uninstalledWallets = useMemo(
    () => wallets?.filter((wallet) => wallet.readyState !== "Installed"),
    [wallets],
  );

  const handleConnect = async (walletName: WalletName) => {
    const success = await connectWallet(walletName);
    if (success) setOpenConnectModal(false);
  };

  const handleDisconnect = async () => {
    const success = await disconnectWallet();
    if (success) {
      await signOut({ redirect: false });
      setOpenWalletModal(false);
    }
  };

  if (connected && wallet && publicKey && signMessage) {
    return (
      <ConnectedWalletModal
        wallet={wallet}
        publicKey={publicKey}
        balance={balance}
        onDisconnect={handleDisconnect}
        open={openWalletModal}
        onOpenChange={setOpenWalletModal}
        isConnecting={isConnecting}
        truncate={truncate}
        signMessage={signMessage}
        setOpenWalletModal={setOpenWalletModal}
        status={status}
      />
    );
  }

  return (
    <WalletConnectModal
      installedWallets={installedWallets}
      uninstalledWallets={uninstalledWallets}
      onConnect={handleConnect}
      open={openConnectModal}
      onOpenChange={setOpenConnectModal}
    />
  );
};
