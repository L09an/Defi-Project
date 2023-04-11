// SwapBox.jsx
import React, { useState, useEffect } from 'react';
import styles from '../../styles/SwapBox.module.css';
import { Network, Alchemy } from 'alchemy-sdk';
//import the contract ABI
import contract from '../../contracts/ERC20.json';

const initalBalance = [{
  address: '',
  tokenBalances: '',
}]
export default function SwapBox({  address }) {

  const [balance, setbalance] = React.useState(initalBalance);

  const settings = {
    apiKey: "6EDoKYlQPVkeYGzQh79M4SUGnV2T3Hre",
    network: Network.ETH_SEPOLIA,
  };

  const alchemy = new Alchemy(settings);

  async function fetechBalance() {
    alchemy.core.getTokenBalances(address).then((result) => {
      setbalance(result.tokenBalances);
      console.log(result)
    });
  }

  const hexToDecimal = hex => {
    const dec = parseInt(hex, 16);
    const reduceDec = dec / 1e18;
    return reduceDec;
  };

  const handleFetech = () => {
    fetechBalance()
  }


  return (
    <div className={styles.swapbox}>
      <h2>Swap</h2>
      <div className={styles.swapinput}>
        <label htmlFor="fromToken">From</label>
        <input type="number" id="fromToken" placeholder="0.0" />
        {/* Replace with your token symbol */}
        <span className={styles.tokensymbol}>ETH</span>
      </div>
      <div className={styles.swaparrow}>&#8595;</div>
      <div className={styles.swapinput}>
        <label htmlFor="toToken">To</label>
        <input type="number" id="toToken" placeholder="0.0" />
        {/* Replace with your token symbol */}
        <span className={styles.tokensymbol}>DAI</span>
      </div>
      <button className={styles.swapbutton}>Swap</button>
      <label htmlFor="swapfee">Swap Fee</label>
      <button className={styles.swapfee} onClick={handleFetech}>select</button>
      <ul>
      {balance.map(token => (
        <li key={token.contractAddress}>
          <p>{token.contractAddress}</p>
          <p>{hexToDecimal(token.tokenBalance)}</p>
        </li>
      ))}
    </ul>
    </div>
  );
};

