// SwapBox.jsx
import React, { useState, useEffect } from 'react';
import styles from '../../styles/SwapBox.module.css';
import { Network, Alchemy } from 'alchemy-sdk';
import SwapContractABI from './SwapcontractABI.json';
//import the contract ABI
import contract from '../../contracts/ERC20.json';

const initalBalance = [{
  address: '',
  tokenBalances: '',
}]

const tokens = [
  { symbol: 'DGT', name: 'Dragon Token' },
  { symbol: 'PXT', name: 'Phenix Token' },
];
export default function SwapBox({ address, connector }) {
  console.log('address:', address, 'connector:', connector)
  const [balance, setbalance] = React.useState(initalBalance);
  const [fromTokenAmount, setFromTokenAmount] = useState('');
  const [toTokenAmount, setToTokenAmount] = useState('');
  const [fromToken, setFromToken] = useState('DGT');
  const [toToken, setToToken] = useState('PXT');
  const [rate, setRate] = useState(0);

  const swapContractAddress = '0xYourSwapContractAddressHere';
  // const swapContract = new ethers.Contract(swapContractAddress, SwapContractABI.abi, signer);
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

  const handleSwap = () => {
    console.log('toTokenAmount:', toTokenAmount, 'fromTokenAmount:', fromTokenAmount, 'fromToken:', fromToken, 'toToken:', toToken)
  }



  return (
    <div className={styles.swapbox}>
      <h2>Swap</h2>
      <div className={styles.swapinput}>
        <label htmlFor="fromToken">From</label>
        <input type="number" id="fromToken" placeholder="0.0" value={fromTokenAmount}
          onChange={(e) => setFromTokenAmount(e.target.value)} />
        <select className={styles.tokensymbol} value={fromToken} onChange={(e) => setFromToken(e.target.value)}>
          {tokens.map((token) => (
            <option key={token.symbol} value={token.symbol}>
              {token.symbol} - {token.name}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.swaparrow}>&#8595;
        <label htmlFor="swapfee">Swap Rate:{rate}</label>
      </div>
      <div className={styles.swapinput}>
        <label htmlFor="toToken">To</label>
        <input type="number" id="toToken" placeholder="0.0" value={toTokenAmount}
          onChange={(e) => setToTokenAmount(e.target.value)}/>
        <select className={styles.tokensymbol} value={toToken} onChange={(e) => setToToken(e.target.value)}>
          {tokens.map((token) => (
            <option key={token.symbol} value={token.symbol}>
              {token.symbol} - {token.name}
            </option>
          ))}
        </select>
      </div>
      <button className={styles.swapbutton} onClick={handleSwap}>Swap</button>

      <button className={styles.swapfee} onClick={handleFetech}>select</button>
      {/* <ul>
        {balance.map(token => (
          <li key={token.contractAddress}>
            <p>{token.contractAddress}</p>
            <p>{hexToDecimal(token.tokenBalance)}</p>
          </li>
        ))}
      </ul> */}
    </div>
  );
};

