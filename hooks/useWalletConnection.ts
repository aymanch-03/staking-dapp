import { WalletName } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useState } from "react";

export const useWalletConnection = () => {
  const { select, connect, disconnect, wallet } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = useCallback(
    async (walletName: WalletName, event?: React.MouseEvent) => {
      event?.preventDefault();

      setIsConnecting(true);
      try {
        if (!walletName) {
          throw new Error("No wallet name provided").message;
        }

        if (wallet?.adapter.name === walletName) {
          await connect();
          return true;
        }

        await select(walletName);
        await connect();

        return true;
      } catch (error) {
        console.error("Wallet connection error:", error);
        return false;
      } finally {
        setIsConnecting(false);
      }
    },
    [select, connect, wallet],
  );

  const disconnectWallet = useCallback(async () => {
    setIsConnecting(true);
    try {
      await disconnect();
      return true;
    } catch (error) {
      console.error("Wallet disconnect error:", error);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [disconnect]);

  return {
    connectWallet,
    disconnectWallet,
    isConnecting,
  };
};
