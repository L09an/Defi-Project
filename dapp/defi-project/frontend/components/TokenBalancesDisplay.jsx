import styles from "../styles/InstructionsComponent.module.css";
import Router, { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Network, Alchemy } from 'alchemy-sdk';

import Chart from "./Chart";
import SwapBox from "./swapbox/SwapBox";

export default function TokenBalancesDisplay( {address, connector} ) {
    const router = useRouter();
    return (
        <div className={styles.container}>
            <header className={styles.header_container}>
                <h1>
                    Token<span>Display</span>
                </h1>
            </header>
            <div className={styles.buttons_container}>
                <SwapBox address={address} connector={connector}></SwapBox>
                <div></div>
            </div>
        </div>
    )
}