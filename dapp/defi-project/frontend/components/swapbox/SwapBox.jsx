// SwapBox.jsx
import React from 'react';
import styles from '../../styles/SwapBox.module.css';

export default function SwapBox () {
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
    </div>
  );
};

