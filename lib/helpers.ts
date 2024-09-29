/**
 * Generates a Solana Explorer URL for a given transaction signature and cluster.
 * Defaults to 'devnet' but supports other clusters like 'mainnet', 'testnet', etc.
 *
 * @param signature - The transaction signature string
 * @param cluster - The Solana network cluster ('devnet', 'testnet', 'mainnet-beta'). Defaults to 'devnet'.
 * @returns A string containing the full URL to view the transaction on the Solana Explorer.
 */
export const explorerUrl = (signature: string, cluster: string = "devnet"): string => {
    const baseUrl = "https://explorer.solana.com/tx/";
    return `${baseUrl}${signature}?cluster=${cluster}`;
};
