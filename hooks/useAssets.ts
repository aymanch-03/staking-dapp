import { authorityKeypair, umi } from "@/lib/utils";
import { NftMetadata } from "@/types";
import { fetchAllDigitalAssetWithTokenByOwner } from "@metaplex-foundation/mpl-token-metadata";
import { fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import { PublicKey } from "@solana/web3.js";
import { useQuery } from '@tanstack/react-query';
import _ from "lodash";

const fetchNfts = async (publicKey: PublicKey | undefined): Promise<NftMetadata[]> => {
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
