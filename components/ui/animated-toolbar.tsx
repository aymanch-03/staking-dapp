import useClickOutside from "@/hooks/useClickOutside";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { LoaderCircle } from "lucide-react";
import MotionNumber from "motion-number";
import { useEffect, useRef, useState } from "react";
import useMeasure from "react-use-measure";
import { Button } from "./button";

const transition = {
  type: "spring",
  bounce: 0.1,
  duration: 0.25,
};
type Props = {
  claimLoading: boolean;
  claimToken: () => void;
  tokenBalance: number;
  isLoading: boolean;
};

export default function ToolbarExpandable({
  claimLoading,
  claimToken,
  tokenBalance,
  isLoading,
}: Props) {
  const [active, setActive] = useState<number | null>(null);
  const [contentRef, { height: heightContent }] = useMeasure();
  const [menuRef, { width: widthContainer }] = useMeasure();
  const ref = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [maxWidth, setMaxWidth] = useState(0);

  useClickOutside(ref, () => {
    setIsOpen(false);
    setActive(null);
  });

  useEffect(() => {
    if (!widthContainer || maxWidth > 0) return;
    setMaxWidth(widthContainer);
  }, [widthContainer, maxWidth]);

  return (
    <MotionConfig transition={transition}>
      <motion.div
        initial={{ y: "100%", x: "-50%", filter: "blur(10px)", opacity: 0 }}
        animate={{ y: 0, x: "-50%", filter: "blur(0px)", opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-0 left-1/2 -translate-x-1/2"
        ref={ref}
      >
        <div className="w-[200px] rounded-xl rounded-b-none bg-primary/45 backdrop-blur-sm">
          <div className="overflow-hidden">
            <AnimatePresence initial={false} mode="sync">
              {isOpen ? (
                <motion.div
                  key="content"
                  initial={{ height: 0 }}
                  animate={{ height: heightContent || 0 }}
                  exit={{ height: 0 }}
                  style={{
                    width: maxWidth,
                  }}
                  className="w-full"
                >
                  <div ref={contentRef} className="p-2">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: active === 1 ? 1 : 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <div
                        className={cn(
                          "px-2 pt-2 text-sm",
                          active === 1 ? "block" : "hidden",
                        )}
                      >
                        <div className="flex flex-col space-y-4">
                          <div className="flex flex-col text-white">
                            <span className="text-center text-base font-bold">
                              <MotionNumber
                                className="mr-1"
                                value={tokenBalance}
                                format={{
                                  notation: "compact",
                                  minimumFractionDigits: 4,
                                  maximumFractionDigits: 4,
                                }}
                                locales="en-US"
                              />{" "}
                              $DEV
                            </span>
                          </div>
                          <Button
                            disabled={
                              isLoading || claimLoading || tokenBalance <= 0
                            }
                            onClick={claimToken}
                            className="relative h-8 w-full scale-100 select-none appearance-none items-center justify-center rounded-lg border border-zinc-950/10 bg-black/45 px-2 text-base text-white transition-colors hover:bg-black/70 focus-visible:ring-2 active:scale-[0.98]"
                            type="button"
                          >
                            Claim $DEV
                            {claimLoading && (
                              <LoaderCircle className="ml-2 size-4 animate-spin" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
          <div className="flex space-x-2 p-2" ref={menuRef}>
            <button
              aria-label={"Balance"}
              className={cn(
                "relative flex size-full shrink-0 scale-100 select-none appearance-none items-center justify-center whitespace-normal rounded-lg text-white transition-colors focus-visible:ring-2 active:scale-[0.98]",
              )}
              type="button"
              onClick={() => {
                if (!isOpen) setIsOpen(true);
                if (active === 1) {
                  setIsOpen(false);
                  setActive(null);
                  return;
                }
                setActive(1);
              }}
            >
              Token Balance
            </button>
          </div>
        </div>
      </motion.div>
    </MotionConfig>
  );
}
