import dynamic from "next/dynamic";
const Wallets = dynamic(
  () => import("./Wallets").then((mod) => mod.ConnectionModal),
  { ssr: false },
);

const Header = () => {
  return (
    <div className="container flex h-20 w-full items-center justify-between">
      <div className="w-32">
        <span className="font-semibold">LOGO</span>
      </div>
      <div className="flex items-stretch gap-2">
        <Wallets />
      </div>
    </div>
  );
};

export default Header;
