"use server"
import { fetchMetadata } from '@/lib/helpers';
import prisma from '@/lib/prisma';
import { Nft } from '@prisma/client';
import { PublicKey } from '@solana/web3.js';

export const getUserNfts = async (publicKey: string) => {
    try {
        if (!publicKey) {
            console.log("No publicKey provided, fetching nfts aborted");
            return;
        }
        const user = await prisma.user.findUnique({ where: { publicKey }, include: { nfts: true } })
        if (!user) {
            throw new Error("User not found")
        }

        const stakedNfts = user.nfts.filter(n => n.isStaked)
        const unstakedNfts = user.nfts.filter(n => !n.isStaked)

        return { stakedNfts, unstakedNfts };
    } catch (error) {
        console.error("Error fetching nfts: " + error)
    }
}

export const stakeNfts = async (publicKey: string, selectedNfts: Nft[]) => {
    if (!publicKey || !selectedNfts || !selectedNfts.length) {
        console.log("No user or NFTs provided for staking.");
        return;
    }

    console.log(`Attempting to stake ${selectedNfts.length} NFTs for user ${publicKey}.`);

    for (const nft of selectedNfts) {
        await prisma.nft.update({
            where: { mint: nft.mint },
            data: {
                isStaked: true,
            },
        });
        console.log(`NFT with mint: ${nft.mint} staked successfully.`);
    }

    console.log(`Staking completed for user ${publicKey}.`);
    return;
};

export const unstakeNfts = async (publicKey: string, selectedNfts: Nft[]) => {
    if (!publicKey || !selectedNfts || !selectedNfts.length) {
        console.log("No user or NFTs provided for unstaking.");
        return;
    }

    console.log(`Attempting to unstake ${selectedNfts.length} NFTs for user ${publicKey}.`);

    for (const nft of selectedNfts) {
        await prisma.nft.update({
            where: { mint: nft.mint },
            data: {
                isStaked: false,
            },
        });
        console.log(`NFT with mint: ${nft.mint} unstaked successfully.`);
    }

    console.log(`Unstaking completed for user ${publicKey}.`);
    return;
};

export const loginUser = async (publicKey: string) => {
    if (!publicKey) {
        console.log("No publicKey provided, registration aborted.");
        return;
    }

    const [existingUser, nfts] = await Promise.all([
        prisma.user.findUnique({ where: { publicKey }, include: { nfts: true } }),
        fetchMetadata(new PublicKey(publicKey))
    ]);

    let user = existingUser;

    if (!user) {
        console.log(`User not found, creating new user with publicKey: ${publicKey}`);
        user = await prisma.user.create({
            data: {
                publicKey: publicKey,
                tokenBalance: 0,
            },
            include: { nfts: true }
        });
        console.log(`User created successfully.`);
    } else {
        console.log(`User found, proceeding with NFTs registration.`);
    }

    const newNfts = (await Promise.all(nfts.map(async (nft) => {
        const existingNft = await prisma.nft.findUnique({ where: { mint: nft.mint } });
        if (existingNft) {
            return null;
        }
        return {
            symbol: nft.symbol,
            name: nft.name,
            mint: nft.mint,
            uri: nft.uri,
            image: nft.image,
            ownerPublicKey: publicKey,
            isStaked: false,
        };
    }))).filter(nft => nft !== null);

    if (newNfts.length > 0) {
        await prisma.nft.createMany({ data: newNfts });
    }

    const ownedMints = nfts.map(nft => nft.mint);
    const nftDetails = await prisma.nft.findMany({
        where: {
            mint: { in: ownedMints },
        },
    });

    for (const nft of nftDetails) {
        const mintExists = user?.nfts.some(item => item.mint === nft.mint);

        if (!mintExists) {
            await prisma.nft.update({
                where: { mint: nft.mint },
                data: {
                    ownerPublicKey: publicKey,
                    isStaked: nft.isStaked,
                }
            });
        }
    }

    const mintsToRemove: string[] = [];
    user?.nfts.forEach(async (nft) => {
        if (!ownedMints.includes(nft.mint)) {
            mintsToRemove.push(nft.mint);
            await prisma.nft.update({ where: { mint: nft.mint }, data: { isStaked: false } });
        }
    });

    if (mintsToRemove.length > 0) {
        await prisma.nft.deleteMany({
            where: { mint: { in: mintsToRemove } }
        });
    }

    return {
        user,
        stakedNfts: user.nfts.filter(nft => nft.isStaked),
        unstakeNfts: user.nfts.filter(nft => !nft.isStaked)
    };
};
