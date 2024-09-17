import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React, { forwardRef } from "react";

type MainButtonProps = {
  text: string | null;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  Icon?: React.ReactNode;
};

const MainButton = forwardRef<HTMLDivElement, MainButtonProps>(
  ({ text, className, onClick, disabled, Icon, ...props }, ref) => {
    return (
      <motion.div
        whileTap={{ scale: 0.95 }}
        ref={ref}
        className={cn(
          "relative inline-flex h-10 w-fit cursor-pointer overflow-hidden rounded-md p-[1.5px] transition-all duration-100 hover:shadow-[0_0_30px_10px_rgba(83,250,251,0.1)] focus:outline-none",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
        onClick={onClick}
        {...props}
      >
        <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#53fafb_0%,#000_100%)] blur-md" />
        <div
          className={cn(
            "flex h-full w-full items-center justify-center gap-2 rounded-md bg-transparent px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl",
            className,
          )}
        >
          {Icon}
          <span>{text}</span>
        </div>
      </motion.div>
    );
  },
);

MainButton.displayName = "MainButton";
export default MainButton;
