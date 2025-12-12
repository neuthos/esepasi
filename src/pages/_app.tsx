import "@/styles/globals.css";
import type {AppProps} from "next/app";
import {AppProviders} from "@/providers/AppProviders";
import {Outfit} from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export default function App({Component, pageProps}: AppProps) {
  return (
    <AppProviders>
      <main className={`${outfit.variable} font-sans antialiased`}>
        <Component {...pageProps} />
      </main>
    </AppProviders>
  );
}
