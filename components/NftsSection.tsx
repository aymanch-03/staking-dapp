import {
  buildStakeTransaction,
  buildUnstakeTransaction,
  loginUser,
  updateNftsStatus,
} from "@/app/_actions/_actions";
import OwnedNfts from "@/components/OwnedNfts";
import StakedNfts from "@/components/StakedNfts";
import { MAX_RETRIES, TABS } from "@/constants";
import { explorerUrl } from "@/lib/helpers";
import { authorityKeypair, signIn } from "@/lib/utils";
import { Action } from "@/types";
import { Tab } from "@/ui/tabs";
import { Nft } from "@prisma/client";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { TokenBalance } from "./TokenBalance";

type Props = {
  connection: Connection;
  ownerPublicKey: PublicKey;
};

export const NftsSection = ({ connection, ownerPublicKey }: Props) => {
  const {
    data: response,
    isLoading: loading,
    isError,
  } = useQuery({
    queryKey: ["loginUser", ownerPublicKey?.toBase58()],
    queryFn: () => loginUser(ownerPublicKey.toBase58()),
    enabled: !!ownerPublicKey,
    staleTime: Infinity,
  });

  const [selected, setSelected] = useState<string>(TABS[0]);

  const { sendTransaction, signMessage } = useWallet();

  const [stakedNfts, setStakedNfts] = useState<Nft[]>([]);
  const [unstakedNfts, setUnstakedNfts] = useState<Nft[]>([]);

  const [selectedNfts, setSelectedNfts] = useState<Nft[]>([]);
  const [toUnstakeNfts, setToUnstakeNfts] = useState<Nft[]>([]);
  const [tokenBalance, setTokenBalance] = useState<number>(0);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleTransaction = useCallback(
    async (nfts: Nft[], action: Action) => {
      if (!ownerPublicKey || !connection || !signMessage) {
        console.error("Missing public key or connection");
        return;
      }

      if (!nfts || nfts.length === 0) {
        console.log(`No NFTs selected or provided for ${action}`);
        return;
      }

      setIsLoading(true);

      try {
        for (let retryCount = 0; retryCount < MAX_RETRIES; retryCount++) {
          if (!authorityKeypair) {
            throw new Error("No authority key found");
          }

          const buildTransaction =
            action === "stake"
              ? buildStakeTransaction
              : buildUnstakeTransaction;
          const buildingTxResponse = await buildTransaction(
            ownerPublicKey.toBase58(),
            nfts,
          );

          if (
            !buildingTxResponse.success ||
            buildingTxResponse.status === 401
          ) {
            toast.error(
              buildingTxResponse?.message ||
                `Error while building ${action} transaction`,
            );

            if (buildingTxResponse.status === 401) {
              await signIn(ownerPublicKey, signMessage);
              continue;
            }
            throw new Error(`Failed to build ${action} transaction`);
          }

          const transactionBase64 = buildingTxResponse.data?.transaction;
          const transaction = Transaction.from(
            Buffer.from(transactionBase64, "base64"),
          );

          toast.loading(`Sending Transaction`, { id: "tx" });
          const latestBlockhash =
            await connection.getLatestBlockhash("finalized");

          const messageV0 = new TransactionMessage({
            recentBlockhash: latestBlockhash.blockhash,
            instructions: transaction.instructions,
            payerKey: ownerPublicKey,
          }).compileToV0Message();

          const versionedTransaction = new VersionedTransaction(messageV0);

          const simulationResult =
            await connection.simulateTransaction(versionedTransaction);

          if (simulationResult.value.err) {
            console.error(
              `Transaction simulation failed: `,
              simulationResult.value.logs,
            );
            toast.error(`Transaction simulation failed`, { id: "tx" });
            continue;
          }

          const signature = await sendTransaction(
            versionedTransaction,
            connection,
            {
              signers: [authorityKeypair],
            },
          );

          const confirmation = await connection.confirmTransaction({
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            signature,
          });

          if (confirmation.value.err) {
            toast.error(`Transaction confirmation failed`, { id: "tx" });
            throw new Error(`Transaction confirmation failed`);
          }

          const response = await updateNftsStatus(
            ownerPublicKey.toBase58(),
            nfts,
            action,
          );

          if (!response.success) {
            console.error(response.message);
            toast.error(`Transaction failed. Please try again`, { id: "tx" });
            continue;
          }

          setStakedNfts(response.data?.stakedNfts ?? []);
          setUnstakedNfts(response.data?.unstakedNfts ?? []);
          toast.success(`Transaction successfully confirmed`, { id: "tx" });

          console.log(`Transaction successful: `, explorerUrl(signature));
          setSelected(action === "stake" ? TABS[1] : TABS[0]);
          break;
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error(error);
          toast.error(error.message, { id: "tx" });
        } else {
          console.error("An unknown error occurred: ", error);
          toast.error("An unknown error occurred", { id: "tx" });
        }
      } finally {
        setIsLoading(false);
        if (action === "stake") {
          setSelectedNfts([]);
        } else {
          setToUnstakeNfts([]);
        }
        toast.dismiss("tx");
      }
    },
    [ownerPublicKey, connection, signMessage, sendTransaction],
  );

  const handleStaking = useCallback(
    () => handleTransaction(selectedNfts, "stake"),
    [selectedNfts, handleTransaction],
  );
  const handleUnstaking = useCallback(
    () => handleTransaction(toUnstakeNfts, "unstake"),
    [toUnstakeNfts, handleTransaction],
  );

  const handleSelectNft = useCallback(
    (
      selectedNft: Nft,
      setStateArray: React.Dispatch<React.SetStateAction<Nft[]>>,
    ) => {
      setStateArray((prevState) =>
        prevState.includes(selectedNft)
          ? prevState.filter((nft) => nft !== selectedNft)
          : [...prevState, selectedNft],
      );
    },
    [],
  );

  useEffect(() => {
    if (response?.success) {
      setStakedNfts(response.data?.stakedNfts ?? []);
      setUnstakedNfts(response.data?.unstakedNfts ?? []);
      setTokenBalance(response.data?.tokenBalance ?? 0);
    }
  }, [response]);

  return (
    <>
      <section className="flex flex-col items-center justify-center gap-4">
        <h1 className="gradient-effect text-center text-4xl leading-[1.4]">
          Staking
        </h1>
        <div className="flex flex-wrap items-center gap-5">
          {TABS.map((tab) => (
            <Tab
              text={tab}
              selected={selected === tab}
              setSelected={setSelected}
              key={tab}
              count={
                tab === "Staked NFTs" && !!stakedNfts.length
                  ? `(${stakedNfts.length})`
                  : undefined
              }
            />
          ))}
        </div>
      </section>
      {selected.toLowerCase() === "owned nfts" ? (
        <OwnedNfts
          unstakedNfts={unstakedNfts}
          selectedNfts={selectedNfts}
          setSelectedNfts={setSelectedNfts}
          isLoading={isLoading}
          handleStaking={handleStaking}
          fetchLoading={loading}
          isError={isError}
          handleSelectNft={handleSelectNft}
        />
      ) : selected.toLowerCase() === "staked nfts" ? (
        <>
          <StakedNfts
            stakedNfts={stakedNfts}
            toUnstakeNfts={toUnstakeNfts}
            setToUnstakeNfts={setToUnstakeNfts}
            handleUnstaking={handleUnstaking}
            handleSelectNft={handleSelectNft}
            isLoading={isLoading}
            setSelectedTab={setSelected}
          />
        </>
      ) : null}

      <TokenBalance
        stakedNfts={stakedNfts}
        isLoading={isLoading}
        tokenBalance={tokenBalance}
        setTokenBalance={setTokenBalance}
      />
    </>
  );
};
