// SwapBox.jsx
import React, { useState, useEffect } from 'react';
import styles from '../../styles/SwapBox.module.css';
import { Network, Alchemy, Utils } from 'alchemy-sdk';
import SwapContractABI from './SwapcontractABI.json';
import { IoIosArrowDown, IoIosRefresh, } from 'react-icons/io';
//import the contract ABI
import ERC20 from './ERC20.json';
import { ethers } from 'ethers';

const initalBalance = [
  { symbol: 'DGT', name: 'Dragon Token', balance: 0, contractAddress: "0x0775b028ad0807cba7f9e4c92f61d9704c486372" }, 
  { symbol: 'PXT', name: 'Phenix Token', balance: 0, contractAddress: "0x6653b22a79c775f80c6dabb7fb8e049249c441f1" }
];

const initalLPpools = [
  { symbol: 'Pool 1', contractAddress: "0x3bd7a249744b6e8f651cad19a51a4b079331b17b" },
  { symbol: 'Pool 2', contractAddress: "0x2cc8ae87202ca9d6632f8c2e038796bee4f7cc10" },
]


export default function SwapBox({ address, connector }) {
  const [tokens, setTokens] = React.useState(initalBalance);
  const [fromTokenAmount, setFromTokenAmount] = useState('');
  const [toTokenAmount, setToTokenAmount] = useState('');
  const [fromToken, setFromToken] = useState('0x0775b028ad0807cba7f9e4c92f61d9704c486372');
  const [toToken, setToToken] = useState('0x6653b22a79c775f80c6dabb7fb8e049249c441f1');
  const [rate, setRate] = useState(0);
  const [LPpools, setLPpools] = useState(initalLPpools);
  const [selectedPool, setSelectedPool] = useState('0x3bd7a249744b6e8f651cad19a51a4b079331b17b');
  const [showModal, setShowModal] = useState(false);
  const [swapOutcome, setSwapOutcome] = useState(0);
  const [estimateInput, setEstimateInput] = useState(0);

  // const swapContractAddress = '0xF54D0c7d6845221763CeFd21Fc6aeDF99B0EFac0';
  const settings = {
    apiKey: "6EDoKYlQPVkeYGzQh79M4SUGnV2T3Hre",
    network: Network.ETH_SEPOLIA,
  };

  const alchemy = new Alchemy(settings);

  const iface = new Utils.Interface(SwapContractABI);
  const Abicoder = new ethers.utils.Interface(SwapContractABI)
  const erc20Abi = new ethers.utils.Interface(ERC20)
  const symbolData = erc20Abi.encodeFunctionData("symbol");
  const nameData = erc20Abi.encodeFunctionData("name");
  const token1ToToken2Rate = iface.encodeFunctionData("getToken1ToToken2Rate");
  const token2ToToken1Rate = iface.encodeFunctionData("getToken2ToToken1Rate");


  // const balanceData = iface.encodeFunctionData("balanceOf", address);

  async function fetechBalance() {
    setSwapOutcome(0)
    setEstimateInput(0)
    alchemy.core.getTokenBalances(address).then((result) => {
      console.log('result:', result)
      const t = [...tokens];
      result.tokenBalances.forEach(token => {
        t.forEach((item, index) => {
          if (item.contractAddress === token.contractAddress) {
            t[index] = { ...t[index], balance: hexToDecimal(token.tokenBalance) }
          }
        })
      })
      setTokens(t)
    });
    if (fromToken === initalBalance[0].contractAddress) {
      alchemy.core.call({ to: selectedPool, data: token2ToToken1Rate }).then((result) => {
        const r = hexToDecimal(result);
        setRate(r)
      });
    }
    if (fromToken === initalBalance[1].contractAddress) {
      alchemy.core.call({ to: selectedPool, data: token1ToToken2Rate }).then((result) => {
        const r = hexToDecimal(result);
        setRate(r)
      });
    }

  }

  const hexToDecimal = hex => {
    const dec = parseInt(hex, 16);
    const reduceDec = dec / 1e18;
    return reduceDec.toFixed(5);
  };

  const handleFetech = () => {
    fetechBalance()
  }

  async function handleSwap() {
    console.log('toTokenAmount:', toTokenAmount, 'fromTokenAmount:', fromTokenAmount, 'fromToken:', fromToken, 'toToken:', toToken)
    try {
      alchemy.core.call({
        to: selectedPool,
        data: symbolData,
      }).then((result) => {
        const symbol = ethers.utils.toUtf8String(result);
        console.log('result:', symbol)
      });
    } catch (e) {
      console.log(e)
    }

    try {
      const ethereum = window.ethereum;
      const provider = new ethers.providers.Web3Provider(ethereum);
      const swapdata = Abicoder.encodeFunctionData("swap", [(Number(fromTokenAmount) * 1e18).toString(), (Number(0) * 1e18).toString()]);
      console.log('swapdata:', swapdata)
      const params = [{
        from: address,
        to: selectedPool,
        data: swapdata,
        nonce: await provider.getTransactionCount(address, "latest").then((result) => { console.log(typeof (result)); return result.toString() }),
        gasLimit: ethers.utils.hexlify(10000),
        gasPrice: ethers.utils.hexlify(parseInt(await provider.getGasPrice())),
      }];

      provider.send('eth_sendTransaction', params).then((result) => {
        console.log('result:', result)
      });
    } catch (e) {
      console.log(e)
    }
  }

  async function handleApprove() {
    try {
      const ethereum = window.ethereum;
      const provider = new ethers.providers.Web3Provider(ethereum);
      const approveData = erc20Abi.encodeFunctionData("approve", [selectedPool, (Number(fromTokenAmount) * 1e18).toString()]);
      console.log('approveData:', approveData)
      const params = [{
        from: address,
        to: fromToken,
        data: approveData,
        nonce: await provider.getTransactionCount(address, "latest").then((result) => { console.log(typeof (result)); return result.toString() }),
        gasLimit: ethers.utils.hexlify(10000),
        gasPrice: ethers.utils.hexlify(parseInt(await provider.getGasPrice())),
      }];

      provider.send('eth_sendTransaction', params).then((result) => {
        console.log('result:', result)
      });
    } catch (e) {
      console.log(e)
    }
  }


  return (
    <div className={styles.swapbox}>
      <div className={styles.swapboxheader}>
        <h2>Swap</h2><button className={styles.swapfee} onClick={handleFetech}><IoIosRefresh /></button>
      </div>

      <select className={styles.poolSelect} onChange={(e) => { setSelectedPool(e.target.value); }}>
        <option value="" disabled defaultValue>Select your Lp pool</option>
        {LPpools.map((LPpool) => (
          <option key={LPpool.contractAddress} value={LPpool.contractAddress}>
            {LPpool.symbol} - {LPpool.contractAddress}
          </option>
        ))}
      </select>
      <div className={styles.swapinput}>
        <label htmlFor="fromToken">From</label>
        <input type="number" id="fromToken" placeholder="0.0" value={fromTokenAmount}
          onChange={(e) => {
            setFromTokenAmount(e.target.value);
            if (e.target.value > 0) {
              const predictOut = iface.encodeFunctionData("predictOut", [(Number(e.target.value) * 1e18).toString(), (Number(0) * 1e18).toString()]);
              try {
                alchemy.core.call({
                  to: selectedPool,
                  data: predictOut,
                }).then((result) => {
                  setSwapOutcome(hexToDecimal(result))
                });
              } catch (e) {
                console.log(e)
              }
            }
          }} />
        <select className={styles.tokenSelect} value={fromToken} onChange={(e) => { setFromToken(e.target.value); }}>
          {tokens.map((token) => (
            <option key={token.symbol} value={token.contractAddress}>
              {token.symbol} - {token.name} - balance: {token.balance}
            </option>
          ))}
        </select>
        {/* <IoIosAdd className="add-icon" onClick={() => setShowModal(true)} /> */}
        <button className={styles.swapbutton} onClick={handleApprove}>Approve</button>
      </div>
      <label htmlFor="swapfee">Estimated input:{estimateInput}</label>
      <div className={styles.swaparrow}>&#8595;
        <label htmlFor="swapfee">Swap Rate:{rate}</label>
      </div>
      <label htmlFor="swapfee">Estimated outcome:{swapOutcome}</label>
      <div className={styles.swapinput}>
        <label htmlFor="toToken">To</label>
        <input type="number" id="toToken" placeholder="0.0" value={toTokenAmount}
          onChange={(e) => {
            setToTokenAmount(e.target.value);
            if (e.target.value > 0) {
              const predictIn = iface.encodeFunctionData("predictIn", [(Number(0) * 1e18).toString(), (Number(e.target.value) * 1e18).toString()]);
              try {
                alchemy.core.call({
                  to: selectedPool,
                  data: predictIn,
                }).then((result) => {
                  setEstimateInput(hexToDecimal(result))
                });
              } catch (e) {
                console.log(e)
              }
              ;
            }
          }} />
        <select className={styles.tokenSelect} value={toToken} onChange={(e) => setToToken(e.target.value)}>
          {tokens.map((token) => (
            <option key={token.symbol} value={token.contractAddress}>
              {token.symbol} - {token.name} - balance: {token.balance}
            </option>
          ))}
        </select>
      </div>
      <button className={styles.swapbutton} onClick={handleSwap}>Swap</button>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add a new token</h3>
            <label>Symbol:</label>
            <input
              type="text"
              value={newTokenSymbol}
              onChange={(e) => setNewTokenSymbol(e.target.value)}
            />
            <label>Name:</label>
            <input
              type="text"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
            />
            <button onClick={handleAddToken}>Add token</button>
            <button onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

