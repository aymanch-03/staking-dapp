"use server";
import { calculateEarnedPoints, fetchMetadata } from "@/lib/helpers";
import prisma from "@/lib/prisma";
import { authorityKeypair, connection } from "@/lib/utils";
import { ResponseData } from "@/types";
import { Nft } from "@prisma/client";
import {
  createAssociatedTokenAccountInstruction,
  createFreezeAccountInstruction,
  createThawAccountInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";

export const loginUser = async (publicKey: string) => {
  if (!publicKey) {
    return {
      success: false,
      message: "No publicKey provided, registration aborted.",
    };
  }

  try {
    const [existingUser, nfts] = await Promise.all([
      prisma.user.findUnique({ where: { publicKey }, include: { nfts: true } }),
      fetchMetadata(new PublicKey(publicKey)),
    ]);

    let user = existingUser;

    if (!user) {
      console.log(
        `User not found, creating new user with publicKey: ${publicKey}`,
      );
      user = await prisma.user.create({
        data: {
          publicKey: publicKey,
          tokenBalance: 0,
          lastLogin: new Date(),
        },
        include: { nfts: true },
      });
    } else {
      const lastLogin = user.lastLogin
      const timeDifference = (new Date().getTime() - lastLogin.getTime()) / 1000;
      await updateTokenBalance(publicKey, timeDifference)
      await prisma.user.update({
        where: { publicKey: publicKey },
        data: {
          lastLogin: new Date(),
        },
      });
    }

    const newNfts = (
      await Promise.all(
        nfts.map(async (nft) => {
          const existingNft = await prisma.nft.findUnique({
            where: { mint: nft.mint },
          });
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
        }),
      )
    ).filter((nft) => nft !== null);

    if (newNfts.length > 0) {
      await prisma.nft.createMany({ data: newNfts });
    }

    const ownedMints = nfts.map((nft) => nft.mint);
    const nftDetails = await prisma.nft.findMany({
      where: { mint: { in: ownedMints } },
    });

    for (const nft of nftDetails) {
      const mintExists = user?.nfts.some((item) => item.mint === nft.mint);
      if (!mintExists) {
        await prisma.nft.update({
          where: { mint: nft.mint },
          data: {
            ownerPublicKey: publicKey,
            isStaked: nft.isStaked,
          },
        });
      }
    }

    const mintsToRemove: string[] = [];
    user?.nfts.forEach((nft) => {
      if (!ownedMints.includes(nft.mint)) {
        mintsToRemove.push(nft.mint);
      }
    });

    if (mintsToRemove.length > 0) {
      await prisma.nft.updateMany({
        where: { mint: { in: mintsToRemove } },
        data: { isStaked: false },
      });
      await prisma.nft.deleteMany({
        where: { mint: { in: mintsToRemove } },
      });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { publicKey },
      include: { nfts: true },
    });

    return {
      success: true,
      data: {
        stakedNfts: updatedUser?.nfts.filter((nft) => nft.isStaked) || [],
        unstakedNfts: updatedUser?.nfts.filter((nft) => !nft.isStaked) || [],
        tokenBalance: updatedUser?.tokenBalance || 0,
      },
    };
  } catch (error) {
    console.error("Error during user login or registration:", error);
    return {
      success: false,
      message: "Error during login",
    };
  }
};



export const getUserNfts = async (publicKey: string) => {
  try {
    if (!publicKey) {
      return {
        success: false,
        message: "No publicKey provided, fetching NFTs aborted.",
      };
    }

    const user = await prisma.user.findUnique({
      where: { publicKey },
      select: { nfts: true },
    });

    if (!user) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    const stakedNfts = user.nfts.filter((n) => n.isStaked);
    const unstakedNfts = user.nfts.filter((n) => !n.isStaked);

    return {
      success: true,
      data: {
        stakedNfts,
        unstakedNfts,
      },
    };
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    return {
      success: false,
      message: "Error fetching NFTs",
    };
  }
};

export const updateNftsStatus = async (
  publicKey: string,
  selectedNfts: Nft[],
  action: "stake" | "unstake",
) => {
  if (!publicKey || !selectedNfts || !selectedNfts.length) {
    return {
      success: false,
      message: "No user or NFTs provided",
    };
  }

  try {
    await prisma.$transaction(async (prisma) => {
      for (const nft of selectedNfts) {
        await prisma.nft.update({
          where: { mint: nft.mint },
          data: {
            isStaked: action === "stake",
            stakedAt: action === "stake" ? new Date() : null,
          },
        });
      }
    });
    const user = await prisma.user.findUnique({ where: { publicKey }, select: { nfts: true } })

    const stakedNfts = user?.nfts.filter((n) => n.isStaked);
    const unstakedNfts = user?.nfts.filter((n) => !n.isStaked);
    return {
      success: true,
      data: { stakedNfts, unstakedNfts },
    };
  } catch (error: any) {
    console.error(`Error during ${action} transaction submission:`, error);
    return {
      success: false,
      message: `Error during ${action} transaction submission: ${error.message}`,
    };
  }
};

export const getUserBalance = async (
  publicKey: string,
): Promise<ResponseData> => {
  try {
    if (!publicKey) {
      return {
        success: false,
        message: "Invalid public key",
      };
    }

    const user = await prisma.user.findUnique({
      where: {
        publicKey,
      },
      select: {
        tokenBalance: true,
      },
    });

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    return {
      success: true,
      data: { balance: user.tokenBalance },
    };
  } catch (error: unknown) {
    console.error("Error fetching user balance:", error);
    return {
      success: false,
      message: `Failed to retrieve user balance: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};

export const claimToken = async (
  publicKey: string,
  amount: number,
): Promise<ResponseData> => {
  try {
    if (!publicKey || amount <= 0) {
      return {
        success: false,
        message: "Invalid Public Key or Amount",
      };
    }

    const recepientPublicKey = new PublicKey(publicKey);
    const mintPubKey = new PublicKey(
      "81Zv6deiAANLHwdaEcNCUGemCwnVUgjt1gFqzDWT1XK7",
    );

    const ataSource = await getAssociatedTokenAddress(
      mintPubKey,
      authorityKeypair.publicKey,
    );

    const ataDestination = await getAssociatedTokenAddress(
      mintPubKey,
      recepientPublicKey,
    );

    const accountInfo = await connection.getAccountInfo(ataDestination);

    if (!accountInfo) {
      const createAccountInstruction = createAssociatedTokenAccountInstruction(
        authorityKeypair.publicKey,
        ataDestination,
        recepientPublicKey,
        mintPubKey,
      );

      const createAccountTransaction = new Transaction().add(
        createAccountInstruction,
      );
      await sendAndConfirmTransaction(connection, createAccountTransaction, [
        authorityKeypair,
      ]);
    }

    const transferInstruction = createTransferInstruction(
      ataSource,
      ataDestination,
      authorityKeypair.publicKey,
      Math.round(amount * 1e6),
    );

    const transaction = new Transaction().add(transferInstruction);
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;
    transaction.feePayer = authorityKeypair.publicKey;
    transaction.partialSign(authorityKeypair);

    const serializedTransaction = transaction
      .serialize({
        requireAllSignatures: false,
      })
      .toString("base64");

    return {
      success: true,
      data: {
        transaction: JSON.stringify({ transaction: serializedTransaction }),
      },
    };
  } catch (error) {
    console.error("Error in claimToken:", error);
    return {
      success: false,
      message: "Failed to claim tokens",
    };
  }
};

export const buildUnstakeTransaction = async (
  publicKey: string,
  selectedNfts: Nft[],
): Promise<ResponseData> => {
  if (!publicKey || !selectedNfts || !selectedNfts.length) {
    console.error("No user or NFTs provided for unstaking.");
    return {
      success: false,
      message: "No user or NFTs provided for unstaking",
    };
  }

  try {
    const ownerPublicKey = new PublicKey(publicKey);
    const transaction = new Transaction();

    for (const nft of selectedNfts) {
      const mintPubKey = new PublicKey(nft.mint);
      const associatedTokenAccount = await getAssociatedTokenAddress(
        mintPubKey,
        ownerPublicKey,
      );
      const accountInfo = await getAccount(connection, associatedTokenAccount);

      if (!accountInfo) {
        const ix = createAssociatedTokenAccountInstruction(
          ownerPublicKey,
          associatedTokenAccount,
          ownerPublicKey,
          mintPubKey,
        );
        transaction.add(ix);
      }
      const thawIx = createThawAccountInstruction(
        associatedTokenAccount,
        new PublicKey(nft.mint),
        authorityKeypair.publicKey,
        [],
      );
      transaction.add(thawIx);
    }

    const latestBlockhash = await connection.getLatestBlockhash();
    transaction.recentBlockhash = latestBlockhash.blockhash;
    transaction.feePayer = ownerPublicKey;
    transaction.partialSign(authorityKeypair);

    const serializedTransaction = transaction
      .serialize({ requireAllSignatures: false })
      .toString("base64");

    return {
      success: true,
      data: { transaction: serializedTransaction },
    };
  } catch (error) {
    return {
      success: false,
      message: "Error building unstaking transaction",
    };
  }
};

export const buildStakeTransaction = async (
  publicKey: string,
  selectedNfts: Nft[],
): Promise<ResponseData> => {
  if (!publicKey || !selectedNfts || !selectedNfts.length) {
    console.error("No user or NFTs provided for staking.");
    return {
      success: false,
      message: "No user or NFTs provided for staking",
    };
  }

  try {
    const ownerPublicKey = new PublicKey(publicKey);
    const transaction = new Transaction();

    for (const nft of selectedNfts) {
      const mintPubKey = new PublicKey(nft.mint);
      const associatedTokenAccount = await getAssociatedTokenAddress(
        mintPubKey,
        ownerPublicKey,
      );
      const accountInfo = await getAccount(connection, associatedTokenAccount);

      if (!accountInfo) {
        const ix = createAssociatedTokenAccountInstruction(
          ownerPublicKey,
          associatedTokenAccount,
          ownerPublicKey,
          mintPubKey,
        );
        transaction.add(ix);
      }
      const freezeIx = createFreezeAccountInstruction(
        associatedTokenAccount,
        new PublicKey(nft.mint),
        authorityKeypair.publicKey,
        [],
      );
      transaction.add(freezeIx);
    }

    const latestBlockhash = await connection.getLatestBlockhash();
    transaction.recentBlockhash = latestBlockhash.blockhash;
    transaction.feePayer = ownerPublicKey;
    transaction.partialSign(authorityKeypair);

    const serializedTransaction = transaction
      .serialize({ requireAllSignatures: false })
      .toString("base64");

    return {
      success: true,
      data: { transaction: serializedTransaction },
    };
  } catch (error) {
    return {
      success: false,
      message: "Error building staking transaction",
    };
  }
};

export const resetBalance = async (publicKey: string) => {
  if (!publicKey) {
    return {
      success: false,
      message: "No publicKey provided. Reset aborted.",
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { publicKey },
    });

    if (!user) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    const updatedUser = await prisma.user.update({
      where: { publicKey },
      data: {
        tokenBalance: 0,
      },
      select: { tokenBalance: true }
    });

    return {
      success: true,
      data: { tokenBalance: updatedUser.tokenBalance }
    };
  } catch (error: any) {
    console.error("Error resetting balance:", error);
    return {
      success: false,
      message: `Error resetting balance: ${error.message}`,
    };
  }
};

export const updateTokenBalance = async (publicKey: string, timeDifferenceInSeconds: number) => {
  try {
    const user = await prisma.user.findUnique({
      where: { publicKey },
      include: { nfts: true },
    });

    if (!user) {
      console.error("User not found for publicKey:", publicKey);
      return {
        success: false,
        message: "User not found."
      };
    }

    const stakedNfts = user.nfts.filter((nft) => nft.isStaked);

    if (stakedNfts.length === 0) {
      console.warn("No staked NFTs to update balance for:", publicKey);
      return {
        success: false,
        message: "No staked NFTs to update balance for."
      };
    }

    const earnedPoints = calculateEarnedPoints(timeDifferenceInSeconds, stakedNfts.length);

    if (isNaN(earnedPoints) || earnedPoints < 0) {
      console.error("Invalid earnedPoints value:", earnedPoints);
      return {
        success: false,
        message: "Invalid earned points value."
      };
    }

    const balanceToAdd = earnedPoints;

    await prisma.user.update({
      where: { publicKey },
      data: {
        tokenBalance: {
          increment: balanceToAdd,
        },
      },
    });

    return;

  } catch (error) {
    console.error("Error updating token balance:", error);

    return {
      success: false,
      message: "An error occurred while updating the token balance."
    };
  }
};
