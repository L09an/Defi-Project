// SwapBox.jsx
import React from 'react';
import styles from '../../styles/SwapBox.module.css'

const SwapBox = () => {
  return (
    <div className={styles.swapBox}>
      <h2>Swap</h2>
      <div className={styles.swapInput}>
        <label htmlFor="fromToken">From</label>
        <input type="number" id="fromToken" placeholder="0.0" />
        {/* Replace with your token symbol */}
        <span className={styles.tokenSymbol}>ETH</span>
      </div>
      <div className={styles.swapArrow}>&#8595;</div>
      <div className={styles.swapInput}>
        <label htmlFor="toToken">To</label>
        <input type="number" id="toToken" placeholder="0.0" />
        {/* Replace with your token symbol */}
        <span className={styles.tokenSymbol}>DAI</span>
      </div>
      <button className={styles.swapButton}>Swap</button>
    </div>
  );
};

export default SwapBox;
