document.addEventListener('DOMContentLoaded', () => {
    const connectButton = document.getElementById('connect-button');
    connectButton.addEventListener('click', connectToMetaMask);
});

async function connectToMetaMask() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Request the user's Ethereum accounts
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

            // Accounts successfully retrieved, you can now use the Ethereum provider API
            console.log('Connected to MetaMask with account:', accounts[0]);
        } catch (error) {
            console.error('Error connecting to MetaMask:', error);
        }
    } else {
        console.error('MetaMask is not installed.');
    }
}
