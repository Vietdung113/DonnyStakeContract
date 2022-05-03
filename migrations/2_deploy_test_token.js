const TestToken = artifacts.require("TestToken"); 
const { web3 } = require("@openzeppelin/test-helpers/src/setup");


module.exports = function (deployer) {
    deployer.deploy(TestToken, web3.utils.toBN("100000000000000000000"));
};