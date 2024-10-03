import { NftMetadata } from "@/types";
import { fetchAllDigitalAssetWithTokenByOwner } from "@metaplex-foundation/mpl-token-metadata";
import { fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import { PublicKey } from "@solana/web3.js";
import _ from "lodash";
import { authorityKeypair, umi } from "./utils";

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

export const fetchMetadata = async (publicKey: PublicKey | undefined): Promise<NftMetadata[]> => {
    if (!publicKey) {
        throw new Error('Public key is required');
    }

    const umiPublicKey = fromWeb3JsPublicKey(publicKey);
    const assets = await fetchAllDigitalAssetWithTokenByOwner(umi, umiPublicKey);
    const nfts = _.filter(assets, (nft) => _.get(nft, 'metadata.updateAuthority') === authorityKeypair.publicKey.toString())

    return Promise.all(
        nfts.map(async (nft) => {
            const metadata = await fetch(nft.metadata.uri).then((res) => res.json());
            return {
                mint: nft.publicKey.toString(),
                name: nft.metadata.name,
                symbol: nft.metadata.symbol,
                uri: nft.metadata.uri,
                image: metadata.image as string,
            };
        })
    );
};
