import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React, { FC } from "react";

type TextEffectProps = {
  label: string;
};

export const TextEffect: FC<TextEffectProps> = ({ label }) => {
  return (
    <motion.span
      className={cn(
        "gradient-effect absolute -top-10 left-1/2 -z-50 -translate-x-1/2 select-none text-[180px] font-extrabold leading-[1.4] md:text-[250px] lg:top-[-90px] lg:text-[400px]",
      )}
      initial={{ opacity: "0%" }}
      animate={{ opacity: "3.5%" }}
      transition={{ delay: 0.5 }}
    >
      {label}
    </motion.span>
  );
};
