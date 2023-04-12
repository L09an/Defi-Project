// SwapBox.jsx
import React, { useState, useEffect } from 'react';
import styles from '../../styles/SwapBox.module.css';
import { Network, Alchemy, Utils } from 'alchemy-sdk';
import SwapContractABI from './SwapcontractABI.json';
import { IoIosArrowDown } from 'react-icons/io';
//import the contract ABI
import ERC20 from './ERC20.json';
import { ethers } from 'ethers';

const initalBalance = [
  { symbol: 'DGT', name: 'Dragon Token', balance:0, contractAddress:'0x84e4f64ba89cd61542d3517b514d602a37acfe8e' },
  { symbol: 'PXT', name: 'Phenix Token', balance:0, contractAddress:'0x7aa866a592457368968d479c9d43179f44211d52' },
];
export default function SwapBox({ address, connector }) {
  const [tokens, setTokens] = React.useState(initalBalance);
  const [fromTokenAmount, setFromTokenAmount] = useState('');
  const [toTokenAmount, setToTokenAmount] = useState('');
  const [fromToken, setFromToken] = useState('DGT');
  const [toToken, setToToken] = useState('PXT');
  const [rate, setRate] = useState(0);

  const swapContractAddress = '0xF54D0c7d6845221763CeFd21Fc6aeDF99B0EFac0';
  const settings = {
    apiKey: "6EDoKYlQPVkeYGzQh79M4SUGnV2T3Hre",
    network: Network.ETH_SEPOLIA,
  };

  const alchemy = new Alchemy(settings);

  const iface = new Utils.Interface(SwapContractABI.output.abi);
  const Abicoder = new ethers.utils.Interface(SwapContractABI.output.abi)
  const erc20Abi = new ethers.utils.Interface(ERC20.output.abi)
  const symbolData = erc20Abi.encodeFunctionData("symbol");
  const nameData = erc20Abi.encodeFunctionData("name");
  const token1ToToken2Rate = iface.encodeFunctionData("getToken1ToToken2Rate");
  const token2ToToken1Rate = iface.encodeFunctionData("getToken2ToToken1Rate");
  // const balanceData = iface.encodeFunctionData("balanceOf", address);

  async function fetechBalance() {
    alchemy.core.getTokenBalances(address).then((result) => {
      const t = [...tokens];
      result.tokenBalances.forEach(token => {
        alchemy.core.call({to: token.contractAddress,data: nameData}).then((result) => {
          const symbol = ethers.utils.toUtf8String(result).split('/0x00').join('')
          console.log(typeof(symbol), symbol)
        });
        t.forEach((item, index) => {
          if ( item.contractAddress === token.contractAddress) {
            t[index] = {...t[index], balance: hexToDecimal(token.tokenBalance)}
          }
        })
      })
      setTokens(t)
    });
    if(fromToken === 'DGT') {
      alchemy.core.call({to: swapContractAddress,data: token1ToToken2Rate}).then((result) => {
        const rate = ethers.utils.formatEther(result);
        setRate(rate)
      });
    }
    if(fromToken === 'PXT') {
      alchemy.core.call({to: swapContractAddress,data: token2ToToken1Rate}).then((result) => {
        const rate = ethers.utils.formatEther(result);
        setRate(rate)
      });
    }
    
  }

  const hexToDecimal = hex => {
    const dec = parseInt(hex, 16);
    const reduceDec = dec / 1e18;
    return reduceDec;
  };

  const handleFetech = () => {
    fetechBalance()
  }

  async function handleSwap () {
    console.log('toTokenAmount:', toTokenAmount, 'fromTokenAmount:', fromTokenAmount, 'fromToken:', fromToken, 'toToken:', toToken)
    try {
      alchemy.core.call({to: swapContractAddress,
        data: symbolData,
      }).then((result) => {
        const symbol = ethers.utils.toUtf8String(result);
        console.log('result:', symbol)});
    } catch (e) {
      console.log(e)
    }

    try{
      const ethereum = window.ethereum;
      const provider = new ethers.providers.Web3Provider(ethereum);
      const swapdata = Abicoder.encodeFunctionData("swap", [(Number(fromTokenAmount) *1e18).toString(), (Number(toTokenAmount) *1e18).toString()]);
      console.log('swapdata:', swapdata)
      const params = [{
        from: address,
        to: swapContractAddress,
        data: swapdata,
        nonce: await provider.getTransactionCount(address, "latest").then((result) => {console.log(typeof(result)); return result.toString()}),
        gasLimit: ethers.utils.hexlify(10000),
        gasPrice: ethers.utils.hexlify(parseInt(await provider.getGasPrice())),}];

      provider.send('eth_sendTransaction', params).then((result) => {
        console.log('result:', result)
      });
    }catch (e) {
      console.log(e)
    }
  }

  
  return (
    <div className={styles.swapbox}>
      <h2>Swap</h2>
      <div className={styles.swapinput}>
        <label htmlFor="fromToken">From</label>
        <input type="number" id="fromToken" placeholder="0.0" value={fromTokenAmount}
          onChange={(e) => setFromTokenAmount(e.target.value)} />
        <select className={styles.tokenSelect} value={fromToken} onChange={(e) => setFromToken(e.target.value)}>
          {tokens.map((token) => (
            <option key={token.symbol} value={token.symbol}>
              {token.symbol} - {token.name} - balance: {token.balance}
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
          onChange={(e) => setToTokenAmount(e.target.value)} />
        <select className={styles.tokenSelect} value={toToken} onChange={(e) => setToToken(e.target.value)}>
          {tokens.map((token) => (
            <option key={token.symbol} value={token.symbol}>
              {token.symbol} - {token.name} - balance: {token.balance}
            </option>
          ))}
        </select>
      </div>
      <button className={styles.swapbutton} onClick={handleSwap}>Swap</button>

      <button className={styles.swapfee} onClick={handleFetech}>Refresh balance</button>
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

