// components/WalletAddress/index.tsx
import { PublicKey } from "@solana/web3.js";
import { Check, Copy } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

interface WalletAddressProps {
  publicKey: PublicKey;
  className?: string;
  size?: "sm" | "md" | "lg";
  showCopyButton?: boolean; // New prop to control copy button visibility
}

export const WalletAddress = ({
  publicKey,
  className = "",
  size = "md",
  showCopyButton = true, // Defaults to true for backward compatibility
}: WalletAddressProps) => {
  const [copied, setCopied] = useState(false);

  const truncate = useMemo(() => {
    const base58 = publicKey.toBase58();
    return `${base58.slice(0, 5)}•••${base58.slice(-5)}`;
  }, [publicKey]);

  const base58 = useMemo(() => publicKey.toBase58(), [publicKey]);

  const copyAddress = useCallback(async () => {
    if (base58) {
      await navigator.clipboard.writeText(base58);
      setCopied(true);
      setTimeout(() => setCopied(false), 800);
    }
  }, [base58]);

  const sizeStyles = {
    sm: "text-sm gap-1",
    md: "text-base gap-1.5",
    lg: "text-xl gap-2",
  };

  return (
    <div className={`flex items-center ${sizeStyles[size]} ${className}`}>
      <span className="font-semibold tracking-wider">{truncate}</span>
      {showCopyButton && (
        <button
          onClick={copyAddress}
          className="flex items-center transition-all hover:opacity-70"
          title="Copy address"
        >
          {copied ? (
            <Check className="size-4 text-green-500" />
          ) : (
            <Copy className="size-4" />
          )}
        </button>
      )}
    </div>
  );
};
