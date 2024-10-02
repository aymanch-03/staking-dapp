"use server"
import prisma from '@/lib/prisma';
import { NftMetadata } from '@/types';
import { Nft, User } from '@prisma/client';

export const registerUser = async (publicKeyString: string, nfts?: NftMetadata[]) => {
    if (!publicKeyString) {
        console.log("No publicKey provided, registration aborted.");
        return;
    }

    try {
        console.log(`Attempting to register user with publicKey: ${publicKeyString}`);

        let user = await prisma?.user.findUnique({
            where: { publicKey: publicKeyString },
        });

        if (!user) {
            console.log(`User not found, creating new user with publicKey: ${publicKeyString}`);
            user = await prisma?.user.create({
                data: {
                    publicKey: publicKeyString,
                    tokenBalance: 0,
                },
            });
            console.log(`User created successfully.`);
        } else {
            console.log(`User found, proceeding with NFTs registration.`);
        }

        if (nfts && nfts.length > 0) {
            console.log(`Processing ${nfts.length} NFTs for registration.`);

            for (const nft of nfts) {
                const existingNft = await prisma.nft.findUnique({
                    where: { mint: nft.mint },
                });

                if (!existingNft) {
                    await prisma.nft.create({
                        data: {
                            name: nft.name,
                            symbol: nft.symbol,
                            mint: nft.mint,
                            uri: nft.uri,
                            image: nft.image,
                            isStaked: false,
                            ownerPublicKey: publicKeyString,
                        },
                    });
                    console.log(`New NFT with mint: ${nft.mint} created.`);
                } else {
                    if (existingNft.ownerPublicKey !== publicKeyString) {
                        await prisma.nft.update({
                            where: { mint: nft.mint },
                            data: {
                                ownerPublicKey: publicKeyString,
                            },
                        });
                        console.log(`NFT with mint: ${nft.mint} ownership updated.`);
                    } else {
                        console.log(`NFT with mint: ${nft.mint} is already registered to this user.`);
                    }
                }
            }
        }

        const registeredUser = await prisma?.user.findUnique({
            where: { publicKey: publicKeyString },
            include: {
                nfts: true,
            },
        });

        console.log(`User registration completed successfully.`);
        return registeredUser;
    } catch (error) {
        console.error("Error registering user:", error);
        throw new Error("Failed to register user");
    }
};

export const getCurrentUser = async (publicKey: string) => {
    if (!publicKey) {
        throw new Error("Public key is required");
    }
    try {

        let user = await prisma.user.findUnique({
            where: { publicKey },
            include: { nfts: true },
        });


        if (!user) {
            console.log("User not found, registering new user...");
            user = await registerUser(publicKey) ?? null;
        }

        return user;
    } catch (error) {
        console.error("Error fetching or registering user:", error);
        throw new Error("Failed to retrieve or register the user");
    }
};

export const stakeNfts = async (authUser: User, selectedNfts: Nft[]) => {
    if (!authUser || !selectedNfts || !selectedNfts.length) {
        console.log("No user or NFTs provided for staking.");
        return;
    }

    console.log(`Attempting to stake ${selectedNfts.length} NFTs for user ${authUser.publicKey}.`);

    for (const nft of selectedNfts) {
        await prisma.nft.update({
            where: { mint: nft.mint },
            data: {
                isStaked: true,
            },
        });
        console.log(`NFT with mint: ${nft.mint} staked successfully.`);
    }

    console.log(`Staking completed for user ${authUser.publicKey}.`);
    return;
};

export const unstakeNfts = async (authUser: User, selectedNfts: Nft[]) => {
    if (!authUser || !selectedNfts || !selectedNfts.length) {
        console.log("No user or NFTs provided for unstaking.");
        return;
    }

    console.log(`Attempting to unstake ${selectedNfts.length} NFTs for user ${authUser.publicKey}.`);

    for (const nft of selectedNfts) {
        await prisma.nft.update({
            where: { mint: nft.mint },
            data: {
                isStaked: false,
            },
        });
        console.log(`NFT with mint: ${nft.mint} unstaked successfully.`);
    }

    console.log(`Unstaking completed for user ${authUser.publicKey}.`);
    return;
};
