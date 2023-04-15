// Import the React and useState hooks, alchemy-sdk, ethers, and the swapbox styles
import React, { useState, useEffect } from 'react';
import styles from '../../styles/SwapBox.module.css';
import { Network, Alchemy, Utils } from 'alchemy-sdk';
import { ethers } from 'ethers';
import { IoIosArrowDown, IoIosRefresh, } from 'react-icons/io';

//import the contract ABI
import ERC20 from './ERC20.json';
import SwapContractABI from './SwapcontractABI.json';

const initalBalance = [
  { symbol: 'DGT', name: 'Dragon Token', balance: 0, contractAddress: "0x0775b028ad0807cba7f9e4c92f61d9704c486372" }, 
  { symbol: 'PXT', name: 'Phenix Token', balance: 0, contractAddress: "0x6653b22a79c775f80c6dabb7fb8e049249c441f1" }
];

const initalLPpools = [
  { symbol: 'Pool 1', contractAddress: "0x3bd7a249744b6e8f651cad19a51a4b079331b17b" },
  { symbol: 'Pool 2', contractAddress: "0x2cc8ae87202ca9d6632f8c2e038796bee4f7cc10" },
]

/**

SwapBox functional component for handling token swapping.
This component maintains the state for tokens, token amounts, selected tokens,
rates, liquidity pools, selected pool, modal visibility, and estimated inputs and outcomes.
It also initializes the Alchemy API client and sets up necessary contract interfaces.
@param {Object} props - The properties passed down from the parent component.
@param {string} props.address - The Ethereum address of the user.
@param {Object} props.connector - The web3-react connector instance.
*/
export default function SwapBox({ address, connector }) {
  const [tokens, setTokens] = React.useState(initalBalance);
  const [fromTokenAmount, setFromTokenAmount] = useState('');
  const [toTokenAmount, setToTokenAmount] = useState('');
  const [fromToken, setFromToken] = useState(initalBalance[0].contractAddress);
  const [toToken, setToToken] = useState(initalBalance[1].contractAddress);
  const [rate, setRate] = useState(0);
  const [LPpools, setLPpools] = useState(initalLPpools);
  const [selectedPool, setSelectedPool] = useState(initalLPpools[0].contractAddress);
  const [swapOutcome, setSwapOutcome] = useState(0);
  const [estimateInput, setEstimateInput] = useState(0);

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

  /**
  Asynchronous function to fetch the user's token balances and update the swap rate.
  This function performs the following tasks:
  Resets the swap outcome and estimated input values.
  Fetches the user's token balances using the Alchemy API and updates the token balance information.
  If the user's selected fromToken matches the initial balance's contract address, fetches the
  token2-to-token1 swap rate from the selected pool.
  If the user's selected fromToken matches the second initial balance's contract address, fetches the
  token1-to-token2 swap rate from the selected pool.
  */
  async function fetechBalance() {
    // Reset swap outcome and estimated input values
    setSwapOutcome(0)
    setEstimateInput(0)
    // Fetch token balances and update balance information
    alchemy.core.getTokenBalances(address).then((result) => {
      result.tokenBalances.forEach(token => {
        t.forEach((item, index) => {
          if (item.contractAddress === token.contractAddress) {
            t[index] = { ...t[index], balance: hexToDecimal(token.tokenBalance) }
          }
        })
      })
      setTokens(t)
    });
    // Fetch token2-to-token1 swap rate if fromToken matches the initial balance's contract 
    if (fromToken === initalBalance[0].contractAddress) {
      alchemy.core.call({ to: selectedPool, data: token2ToToken1Rate }).then((result) => {
        const r = hexToDecimal(result);
        setRate(r)
      });
    }
    // Fetch token1-to-token2 swap rate if fromToken matches the second initial balance's 
    if (fromToken === initalBalance[1].contractAddress) {
      alchemy.core.call({ to: selectedPool, data: token1ToToken2Rate }).then((result) => {
        const r = hexToDecimal(result);
        setRate(r)
      });
    }

  }

  /**
  Converts a hexadecimal number to a decimal number with a fixed precision of 5 decimal places.
  @param {string} hex - The hexadecimal number to be converted.
  @returns {string} The converted decimal number as a string with a fixed precision of 5 decimal places.
  */
  const hexToDecimal = hex => {
    const dec = parseInt(hex, 16);
    const reduceDec = dec / 1e18;
    return reduceDec.toFixed(5);
  };

  const handleFetech = () => {
    fetechBalance()
  }

  /**
  Asynchronous function to handle a token swap.
  This function performs the following tasks:
  Fetches the token symbol from the selected pool using the Alchemy API.
  Sets up the necessary parameters for the swap transaction using the ethers.js library.
  Sends the swap transaction using the Web3Provider.
  Note: Any errors encountered during the process are logged to the console.
  */
  async function handleSwap() {
    try {
      // Fetch token symbol from the selected pool
      alchemy.core.call({
        to: selectedPool,
        data: symbolData,
      }).then((result) => {
        const symbol = ethers.utils.toUtf8String(result);
      });
    } catch (e) {
      console.log(e)
    }
      
    try {
      // Set up transaction parameters for the swap transaction
      const ethereum = window.ethereum;
      const provider = new ethers.providers.Web3Provider(ethereum);
      const swapdata = Abicoder.encodeFunctionData("swap", [(Number(fromTokenAmount) * 1e18).toString(), (Number(0) * 1e18).toString()]);
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

  /**
  Asynchronous function to handle token approval for a swap transaction.

  This function performs the following tasks:

  Sets up the necessary parameters for the token approval transaction using the ethers.js library.
  Sends the token approval transaction using the Web3Provider.
  Note: Any errors encountered during the process are logged to the console.
  */
  async function handleApprove() {
    try {
      // Set up transaction parameters for token approval
      const ethereum = window.ethereum;
      const provider = new ethers.providers.Web3Provider(ethereum);
      const approveData = erc20Abi.encodeFunctionData("approve", [selectedPool, (Number(fromTokenAmount) * 1e18).toString()]);
      const params = [{
        from: address,
        to: fromToken,
        data: approveData,
        nonce: await provider.getTransactionCount(address, "latest").then((result) => { console.log(typeof (result)); return result.toString() }),
        gasLimit: ethers.utils.hexlify(10000),
        gasPrice: ethers.utils.hexlify(parseInt(await provider.getGasPrice())),
      }];
      // Send the token approval transaction
      provider.send('eth_sendTransaction', params).then((result) => {
        console.log('result:', result)
      });
    } catch (e) {
      console.log(e)
    }
  }

  /**
  Swap box component for token swapping.
  The component includes the following elements:
  Swap box header with a refresh button to fetch updated swap data.
  A drop-down menu for selecting a liquidity pool (LP) pool.
  Input fields for selecting the 'from' token and specifying the token amount,
  an 'Approve' button for token approval, and a label to display the estimated input.
  Swap rate and direction arrow.
  A label to display the estimated outcome of the swap.
  Input fields for selecting the 'to' token and specifying the token amount,
  and a label to display the estimated input.
  A 'Swap' button to initiate the token swap.
  */
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
                alchemy.core.call({to: selectedPool,data: predictOut,}).then((result) => {
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
                alchemy.core.call({to: selectedPool,data: predictIn,}).then((result) => {
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
    </div>
  );
};

