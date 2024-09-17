import { NftMetadata } from "@/components/NftsSection";
import { umi } from "@/lib/utils";
import { fetchAllDigitalAssetWithTokenByOwner } from "@metaplex-foundation/mpl-token-metadata";
import { fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";

export const useAssets = (publicKey: PublicKey) => {
    const [nfts, setNfts] = useState<NftMetadata[]>([]);
    useEffect(() => {
        const getNftsMetadata = async (owner: PublicKey) => {
            try {
                const umiPublicKey = fromWeb3JsPublicKey(owner);
                const assets = await fetchAllDigitalAssetWithTokenByOwner(
                    umi,
                    umiPublicKey,
                );

                const nftMetadata = await Promise.all(
                    assets.map(async (asset) => {
                        const metadata = await fetch(asset.metadata.uri).then((res) =>
                            res.json(),
                        );
                        return {
                            name: asset.metadata.name,
                            symbol: asset.metadata.symbol,
                            uri: asset.metadata.uri,
                            image: metadata.image,
                        };
                    }),
                );

                setNfts(nftMetadata);
            } catch (error) {
                console.error("Error fetching NFTs:", error);
            }
        };

        if (publicKey) {
            getNftsMetadata(publicKey);
        }
    }, [publicKey]);
    return nfts
}