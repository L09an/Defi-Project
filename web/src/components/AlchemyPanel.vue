<template>
  <div>
      <button @click="main">Test</button>
  </div>
</template>


<script>
// Setup: npm install @alch/alchemy-sdk
const { Network, Alchemy } = require("alchemy-sdk");


export default {
    name: 'AlchemyPanel',
    setup() {
      // Optional Config object, but defaults to demo api-key and eth-mainnet.
      const settings = {
        apiKey: "6EDoKYlQPVkeYGzQh79M4SUGnV2T3Hre",
        network: Network.ETH_SEPOLIA,
      };

      const alchemy = new Alchemy(settings);

      async function main() {
        const latestBlock = await alchemy.core.getBlockNumber();
        console.log("The latest block number is", latestBlock);
      }

    return{
      main
    }
  }
}

</script>
