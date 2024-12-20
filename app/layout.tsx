import ContextProvider from "@/providers/ContextProvider";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const calSans = localFont({
  src: "./fonts/CalSans-SemiBold.otf",
  variable: "--font-cal",
});
const circular = localFont({
  src: [
    {
      path: "./fonts/CircularStd-Book.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/CircularStd-BookItalic.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/CircularStd-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/CircularStd-MediumItalic.otf",
      weight: "500",
      style: "italic",
    },
    {
      path: "./fonts/CircularStd-Bold.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/CircularStd-BoldItalic.otf",
      weight: "600",
      style: "italic",
    },
    {
      path: "./fonts/CircularStd-Black.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/CircularStd-BlackItalic.otf",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-circular",
});
const firs = localFont({
  src: [
    {
      path: "./fonts/TT Firs Neue Trial Thin.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "./fonts/TT Firs Neue Trial ExtraLight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "./fonts/TT Firs Neue Trial Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/TT Firs Neue Trial Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/TT Firs Neue Trial Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/TT Firs Neue Trial DemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/TT Firs Neue Trial Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/TT Firs Neue Trial ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "./fonts/TT Firs Neue Trial Black.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-firs",
});

export const metadata: Metadata = {
  title: "Staking Dapp",
  description: "Staking Dapp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${circular.variable} ${firs.variable} ${calSans.variable} h-[100vh] overflow-x-hidden font-heading antialiased`}
      >
        <ContextProvider>{children}</ContextProvider>
      </body>
    </html>
  );
}
