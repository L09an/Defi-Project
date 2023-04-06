<template>
    <div>
        <button @click="connectToMetaMask">Connect Wallet</button>
        <p v-if="account">Connected with account: {{ account }}</p>
    </div>
</template>
  
<script>
// import { Web3Provider } from 'ethers/providers';

import { ref } from 'vue';
export default {
    setup() {
        const account = ref('');

        const connectToMetaMask = async () => {
            console.log("accounts")
            if (window.ethereum) {
                try {
                    // Request the user's Ethereum accounts
                    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

                    // Accounts successfully retrieved, you can now use the Ethereum provider API
                    account.value = accounts[0];

                    console.log("address: "+account.value)
                } catch (error) {
                    console.error('Error connecting to MetaMask:', error);
                }
            } else {
                console.error('MetaMask is not installed.');
            }
        };

        return {
            account,
            connectToMetaMask,
        };
    },
};
</script>
  