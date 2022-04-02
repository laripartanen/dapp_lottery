require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');
const Web3 = require('web3');
const { abi, evm } = require('./compile');

let provider = new HDWalletProvider(
    process.env.ETH_MNEMONIC,
    process.env.ETH_URL
);

const web3 = new Web3(provider);

(async () => {
    const accounts = await web3.eth.getAccounts();
    console.log('Attempting to deploy from account', accounts[0]);
    const result = await new web3.eth.Contract(abi)
        .deploy({ data: evm.bytecode.object })
        .send({ gas: '1000000', from: accounts[0] });

    console.log(web3.eth.contract(abi));
    console.log('Contract deployed to', result.options.address);
    provider.engine.stop();
})();
