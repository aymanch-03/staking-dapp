import { motion } from "framer-motion";

interface TabProps {
  text: string;
  selected: boolean;
  setSelected: (text: string) => void;
}

export const Tab = ({ text, selected, setSelected }: TabProps) => {
  return (
    <button
      onClick={() => setSelected(text)}
      className={`${
        selected ? "text-white" : "text-gray-400"
      } relative rounded-md px-3 py-1 text-base font-medium transition-colors`}
    >
      <span className="relative z-10">{text}</span>
      {selected && (
        <motion.span
          layoutId="tab"
          transition={{ type: "spring", duration: 0.4 }}
          className="absolute inset-0 z-0 rounded-md bg-primary/50"
        ></motion.span>
      )}
    </button>
  );
};
