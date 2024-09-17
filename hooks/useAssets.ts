import { NftMetadata } from "@/components/NftsSection";
import { umi } from "@/lib/utils";
import { fetchAllDigitalAssetWithTokenByOwner } from "@metaplex-foundation/mpl-token-metadata";
import { fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import { PublicKey } from "@solana/web3.js";
import { useQuery } from '@tanstack/react-query';

const fetchNfts = async (publicKey: PublicKey | undefined): Promise<NftMetadata[]> => {
    if (!publicKey) {
        throw new Error('Public key is required');
    }

    const umiPublicKey = fromWeb3JsPublicKey(publicKey);
    const assets = await fetchAllDigitalAssetWithTokenByOwner(umi, umiPublicKey);

    return Promise.all(
        assets.map(async (asset) => {
            const metadata = await fetch(asset.metadata.uri).then((res) => res.json());
            return {
                name: asset.metadata.name,
                symbol: asset.metadata.symbol,
                uri: asset.metadata.uri,
                image: metadata.image,
            };
        })
    );
};

export const useAssets = (publicKey: PublicKey | undefined) => {
    return useQuery<NftMetadata[], Error>({
        queryKey: ['nfts', publicKey?.toString()],
        queryFn: () => fetchNfts(publicKey),
        enabled: !!publicKey,
        staleTime: 60000,
        gcTime: 300000,
        retry: 2,
    })
};