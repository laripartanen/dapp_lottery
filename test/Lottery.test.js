const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());
const { abi, evm } = require('../compile');

let accounts;
let contract;

beforeEach(async () => {
    // Get a list of all accounts
    accounts = await web3.eth.getAccounts();

    // Use of those accounts to deploy the contract
    contract = await new web3.eth.Contract(abi)
        .deploy({ 
            data: evm.bytecode.object
        }) // create transaction object
        .send({ from: accounts[0], gas: '1000000' }) // send to blockchain
});

describe('Lottery', () => {

    it('deploys a contract', () => {
        assert.ok(contract.options.address);
    });

    it('allows one account to enter', async () => {
        await contract.methods.enter().send({ 
            from: accounts[0], 
            value: web3.utils.toWei('0.02', 'ether')
        });
        
        const players = await contract.methods.getPlayers().call();
        assert.equal(accounts[0], players[0]);
        assert.equal(1, players.length);
    });
    
    it('allows two accounts to enter', async () => {
        await contract.methods.enter().send({ 
            from: accounts[0], 
            value: web3.utils.toWei('0.02', 'ether')
        });
        await contract.methods.enter().send({ 
            from: accounts[1], 
            value: web3.utils.toWei('0.02', 'ether')
        });
        
        const players = await contract.methods.getPlayers().call();
        assert.equal(accounts[0], players[0]);
        assert.equal(accounts[1], players[1]);
        assert.equal(2, players.length);
    });
    
    it('requires eth limit to enter', async () => {
        try {
            await contract.methods.enter().send({ 
                from: accounts[0], 
                value: web3.utils.toWei('0.05', 'ether')
            });
            assert(false);
        } catch (err) {
            assert(err);
        }
    });

    it('only manager can call pickWinner', async () => {
        try {
            await contract.methods.pickWinner().send({
                from: accounts[1]
            });
            assert(false);
        } catch (err) {
            assert(err);
        }
    });

    it('sends money to winner and resets players array', async () => {
        await contract.methods.enter().send({ 
            from: accounts[0], 
            value: web3.utils.toWei('2', 'ether')
        });

        const initialBalance = await web3.eth.getBalance(accounts[0]);
        await contract.methods.pickWinner().send({ from: accounts[0] });
        const finalBalance = await web3.eth.getBalance(accounts[0]);
        const difference = finalBalance - initialBalance;

        assert(difference > web3.utils.toWei('1.8', 'ether'));

        const players = await contract.methods.getPlayers().call();
        assert.equal(0, players.length);
    });
});
