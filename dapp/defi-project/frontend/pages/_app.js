import "../styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";

import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createClient, useAccount, WagmiConfig } from "wagmi";
import {
  mainnet,
  goerli,
  sepolia,
} from "wagmi/chains";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
import MainLayout from "../layout/mainLayout";
import { useRouter } from "next/router";
import WalletContext from './context';

import React from 'react';
const { chains, provider } = configureChains(
  [
    mainnet,
    goerli,
    sepolia,
  ],
  [alchemyProvider({ apiKey: process.env.ALCHEMY_API_KEY }), publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: "My Alchemy DApp",
  chains,
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

export { WagmiConfig, RainbowKitProvider };

function MyApp({ Component, pageProps }) {
  const [address, setAdresss] = React.useState(null);
  const [wallet, setWallet] = React.useState(null);
  const router = useRouter()
  const account = useAccount({
    onConnect({ address, connector, isReconnected }) {setWallet(connector); setAdresss(address);
      if (!isReconnected) router.reload();
    },
  });
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider
        modalSize="compact"
        initialChain={process.env.NEXT_PUBLIC_DEFAULT_CHAIN}
        chains={chains}
      >
        <MainLayout address={address} connector={wallet}>
          <Component {...pageProps} />
        </MainLayout>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

export default MyApp;
