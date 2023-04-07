import styles from "../styles/InstructionsComponent.module.css";
import Router, { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Network, Alchemy } from 'alchemy-sdk';


export default function TokenBalancesDisplay() {
    const router = useRouter();



    const settings = {
        apiKey: "6EDoKYlQPVkeYGzQh79M4SUGnV2T3Hre",
        network: Network.ETH_SEPOLIA,
    };

    const alchemy = new Alchemy(settings);

    // Get the latest block
    const latestBlock = alchemy.core.getBlockNumber();

    // Get all outbound transfers for a provided address
    alchemy.core
        .getTokenBalances('0x994b342dd87fc825f66e51ffa3ef71ad818b6893')
        .then(console.log);

    // Get all the NFTs owned by an address
    const nfts = alchemy.nft.getNftsForOwner("0xshah.eth");

    // Listen to all new pending transactions
    alchemy.ws.on(
        {
            method: "alchemy_pendingTransactions",
            fromAddress: "0xshah.eth"
        },
        (res) => console.log(res)
    );
    return (
        <div className={styles.container}>
            <header className={styles.header_container}>
                <h1>
                    Token<span>Display</span>
                </h1>
            </header>
            <div className={styles.buttons_container}>
                <p>{nfts}</p>
            </div>
        </div>
    )
}