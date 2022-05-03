const {expectRevert, BN} = require("@openzeppelin/test-helpers");
const { utils, constants } = require('../lib');
const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const expectEvent = require("@openzeppelin/test-helpers/src/expectEvent");
const { time } = require('@openzeppelin/test-helpers');    


const StakeContract = artifacts.require("StakeContract");
const TestToken = artifacts.require("TestToken");


async function timeIncreaseTo (seconds) {
    const delay = 1000 - new Date().getMilliseconds();
    await new Promise(resolve => setTimeout(resolve, delay));
    await time.increaseTo(seconds);
}

contract("StakeContract", (accounts)=>{
    let testtoken;
    let stakeContract;
    let receipt;

    before(async ()=>{
        testtoken = await TestToken.new(web3.utils.toBN("100000000000000000000"));
        stakeContract = await StakeContract.new(testtoken.address);
    });

    describe("Simple test", ()=>{
        it("Simple test", async ()=>{
            let timePeriods = [2592000, 7776000, 15552000, 31104000];
            let interestRates = ["5", "15", "40", "100"];

            for (let i = 0; i < 4; i++) {
                await testtoken.transfer(
                    accounts[1], web3.utils.toBN("1000000000001"),
                    {from: accounts[0], gasPrice: 0}
                );
                await testtoken.approve(
                    stakeContract.address, web3.utils.toBN("1000000000001"),
                    {from: accounts[1], gasPrice: 0}
                );
                await testtoken.transfer(
                    stakeContract.address, web3.utils.toBN("1000000000001"),
                    {from: accounts[0], gasPrice: 0}
                );

                let balanceToStake = web3.utils.toBN("1000000000000");
                let interest = balanceToStake.mul(new BN(interestRates[i])).div(new BN("100"));
                let balanceToWithdraw = balanceToStake.add(interest);
                receipt = await stakeContract.stakeTokens(
                    testtoken.address, balanceToStake, i,
                    {from: accounts[1], gasPrice: 0}
                );
                let stakeId = utils.getStakeIdFromReceipt(receipt);

                let block = await web3.eth.getBlock('latest');
                await timeIncreaseTo(block.timestamp + timePeriods[i]);

                receipt = await stakeContract.unstakeTokens(
                    stakeId, {from: accounts[1], gasPrice: 0}
                );
                let withdrawnBalance = await utils.getWithdrawnBalanceFromReceipt(receipt);
                assert.equal(withdrawnBalance.toString(), balanceToWithdraw.toString());
            }
        });
    });
});
