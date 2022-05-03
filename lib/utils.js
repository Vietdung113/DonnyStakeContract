const {BN} = require("@openzeppelin/test-helpers");


function getBlockNumberFromReceipt(receipt) {
    return receipt.receipt.blockNumber;
}

function getStakeIdFromReceipt(receipt) {
    for (let i = 0; i < receipt.logs.length; i++) {
        if (receipt.logs.at(i).event == "tokensStaked") {
            return receipt.logs.at(i).args.id.toNumber();
        }
    }
}

function getWithdrawnBalanceFromReceipt(receipt) {
    for (let i = 0; i < receipt.logs.length; i++) {
        if (receipt.logs.at(i).event == "TokensUnstaked") {
            return receipt.logs.at(i).args.amount;
        }
    }
}

async function getBalanceAsBN(account) {
    return await web3.eth.getBalance(account).then((b)=>{ 
        return web3.utils.toBN(b); 
    });
}

async function getErc20BalanceAsBN(account, erc20) {
    return await erc20.balanceOf(account);
}

async function getNftBalanceAsNumber(arttoken, account, tokenIds) {
    let NftBalance = []
    for(let i = 0; i < tokenIds.length; i++) {
        let receipt = await arttoken.balanceOf(account, tokenIds[i]);
        receipt = receipt.toNumber();
        NftBalance.push(receipt);
    }
    return NftBalance;
}

function getSellerFeeAndMarketplaceFeeAsBN(nftPrice, mpFeePortion) {
    let marketplaceFee = web3.utils.toBN(nftPrice)
        .mul(web3.utils.toBN(mpFeePortion))
        .div(new BN("10000"));
    let sellerFee = web3.utils.toBN(nftPrice).sub(marketplaceFee);
    return [marketplaceFee, sellerFee];
}


module.exports = {
    getStakeIdFromReceipt,
    getWithdrawnBalanceFromReceipt,
    getBalanceAsBN,
    getErc20BalanceAsBN,
    getNftBalanceAsNumber,
    getSellerFeeAndMarketplaceFeeAsBN,
    getBlockNumberFromReceipt
}