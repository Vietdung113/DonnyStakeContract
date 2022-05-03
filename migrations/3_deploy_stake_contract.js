const StakeContract = artifacts.require("StakeContract"); 
const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const ZERO_ADDRESS = web3.utils.padLeft(web3.utils.toHex(1), 40);


module.exports = function (deployer) {
    deployer.deploy(StakeContract, ZERO_ADDRESS);
};