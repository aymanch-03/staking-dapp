import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";

export function useGetBalance(
    publicKey: PublicKey | null,
    connection: Connection,
) {
    const [balance, setBalance] = useState<number>(0);

    useEffect(() => {
        const getWalletBalance = async () => {
            if (connection && publicKey) {
                try {
                    const balance = await connection.getBalance(publicKey);
                    setBalance(balance / LAMPORTS_PER_SOL);
                } catch (error) {
                    console.error("Error getting balance:", error);
                }
            }
        };
        getWalletBalance();
    }, [connection, publicKey]);
    return balance;
}
