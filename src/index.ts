import { config } from 'dotenv';
config();

import { BigNumber, BigNumberish } from 'ethers';
import { account, chainProvider, CraftsmanContract, ERC20Interface, tokens, VVSPairInterface, VVSRouterContract } from './abis';
import Logger from "./utils/logger";

const NO_OF_BLOCK_CONFIRMATIONS = 10;

const BN2Str = (_bn:BigNumberish) => {
    return BigNumber.from(_bn).toString();
}

// Test if it is going
chainProvider.getBlockNumber().then((result) => {
    Logger.log("Current block number: " + result);
    Logger.log(account.address, "<== Address");
});
// Done

// Now create all the functions here according to step in todo file

// 1. Function to harvest from the LP farm
const POOL_ID = 5; // Pool ID for VVS-USDC Farm Pool
const harvestFromFarm = async () => {
    try {
        // This will harvest the VVS from the pool
        const response = await CraftsmanContract.deposit(POOL_ID, 0, { gasLimit: 200000 });
        Logger.log(response);
        const { hash } = response;

        Logger.log(`Waiting for ${NO_OF_BLOCK_CONFIRMATIONS} confirmations...`);
        const txMined = await chainProvider.waitForTransaction(hash, NO_OF_BLOCK_CONFIRMATIONS);
        Logger.log(`${NO_OF_BLOCK_CONFIRMATIONS} blocks confirmed`);

        if (txMined.status !== 1) throw new Error("Mining Failed");
        return { response };
    } catch(err) {
        Logger.log(err, "<== Harvest LP Error");
    }
}

// 2. Swap exact tokens
const swapHalfVVSForUSDC = async () => {
    try {
        const VVSUSDCPair = [tokens.VVS.address, tokens.USDC.address];
        const VVSTokenContract = await ERC20Interface(tokens.VVS.address);
        const USDCTokenContract = await ERC20Interface(tokens.USDC.address);
        // Step 1: Get the amount of VVS inside this account
        const getVVSAmount = await VVSTokenContract.balanceOf(account.address);
        const halfedVVSAmount = BigNumber.from(getVVSAmount).div(2).toString(); // Divide total amount by 2
        Logger.log(halfedVVSAmount, "<== Halfed VVS");

        // Step 2: Get the amount needed to be passed in for swapping
        const response = await VVSRouterContract.getAmountsOut(halfedVVSAmount,  VVSUSDCPair);
        if (!response || response.length < 2) throw new Error("Invalid Response from step 2");
        const [ amountIn, amountOut ] = response;

        const amountInStr = BigNumber.from(amountIn).toString();
        const minAmountOut = BigNumber.from(amountOut).mul(995).div(1000).toString(); // 0.5% slippage

        Logger.log(amountInStr, " | ", minAmountOut, "<== VVS | USDC");

        Logger.log([
            amountInStr,
            minAmountOut,
            VVSUSDCPair,
            account.address,
            Math.floor(Date.now()/1000) + (20*60)
        ], "<== All parameters");
        // return;
        // Step 3: Swap the tokens
        const swapTokens = await VVSRouterContract.swapExactTokensForTokens(
            amountInStr,
            minAmountOut,
            VVSUSDCPair,
            account.address,
            Math.floor(Date.now()/1000) + (20*60) // 20 minutes from now
        );
        Logger.log(swapTokens, "<== SWAP VVS-USDC successful");

        const { hash } = swapTokens;

        Logger.log(`Waiting for ${NO_OF_BLOCK_CONFIRMATIONS} confirmations...`);
        const txMined = await chainProvider.waitForTransaction(hash, NO_OF_BLOCK_CONFIRMATIONS);
        Logger.log(`${NO_OF_BLOCK_CONFIRMATIONS} blocks confirmed`);

        if (txMined.status !== 1) throw new Error("Mining Failed");
        return {
            amountInStr,
            minAmountOut,
            halfedVVSAmount,
            swapTokens
        }
    } catch (error) {
        Logger.log(error, "<== SWAP VVS-USDC Error");
    }
}

// 3. Add to liquidity pool
const addVVSUSDCLP = async () => {
    try {
        const VVSUSDCPair = [tokens.VVS.address, tokens.USDC.address];
        const VVSTokenContract = await ERC20Interface(tokens.VVS.address);
        const USDCTokenContract = await ERC20Interface(tokens.USDC.address);
        const VVSUSDCPairContract = await VVSPairInterface(tokens.VVSLP.address);
        // Step 1: Get the amount of USDC inside this account
        const getUSDCAmount = await USDCTokenContract.balanceOf(account.address);
        const getVVSAmount = await VVSTokenContract.balanceOf(account.address);

        // Step 2: Get the amount needed to be passed in for LP
        const reserves = await VVSUSDCPairContract.getReserves();
        const [ reserveA, reserveB ] = reserves;

        const quoteVVS = await VVSRouterContract.quote(getUSDCAmount, reserveB, reserveA);
        const quoteUSDC = await VVSRouterContract.quote(getVVSAmount, reserveA, reserveB);

        let amountADesired;
        let amountBDesired;
        if (BigNumber.from(getVVSAmount).gte(quoteVVS)) {
            amountADesired = quoteVVS;
            amountBDesired = getUSDCAmount;
        } else {
            amountADesired = getVVSAmount;
            amountBDesired = quoteUSDC;
        }

        const amountAMin = BigNumber.from(amountADesired).mul(995).div(1000); // 0.5% slippage
        const amountBMin = BigNumber.from(amountBDesired).mul(995).div(1000); // 0.5% slippage

        Logger.log({
            tokenA: VVSUSDCPair[0],
            tokenB: VVSUSDCPair[1],
            amountADesired: BN2Str(amountADesired),
            amountBDesired: BN2Str(amountBDesired),
            amountAMin: BN2Str(amountAMin),
            amountBMin: BN2Str(amountBMin),
            to: account.address,
            deadline: Math.floor(Date.now()/1000) + (20*60) // 20 minutes from now
        });
        // return;

        const addLiquidity = await VVSRouterContract.addLiquidity(
            VVSUSDCPair[0],
            VVSUSDCPair[1],
            amountADesired,
            amountBDesired,
            amountAMin,
            amountBMin,
            account.address,
            Math.floor(Date.now()/1000) + (20*60), // 20 minutes from now
            { gasLimit: 235953 }
        );
        Logger.log(addLiquidity, "<== Add VVS-USDC Liquidity successful");
        const { hash } = addLiquidity;

        Logger.log(`Waiting for ${NO_OF_BLOCK_CONFIRMATIONS} confirmations...`);
        const txMined = await chainProvider.waitForTransaction(hash, NO_OF_BLOCK_CONFIRMATIONS);
        Logger.log(`${NO_OF_BLOCK_CONFIRMATIONS} blocks confirmed`);

        if (txMined.status !== 1) throw new Error("Mining Failed");
        return addLiquidity;
    } catch (error) {
        Logger.log(error, "<== Add Liquidity Error");
    }
}

// 4. Deposit to Farm
const depositToFarm = async () => {
    try {
        // 1. Get the number of LP Available
        const VVSLPTokenContract = await ERC20Interface(tokens.VVSLP.address);
        const getVVSLPBalance = await VVSLPTokenContract.balanceOf(account.address);
        Logger.log(BN2Str(getVVSLPBalance), "<== VVS LP Amount");
        // return;
        const response = await CraftsmanContract.deposit(POOL_ID, getVVSLPBalance, { gasLimit: 200000 });
        Logger.log(response, "<== Deposit successful");
        const { hash } = response;

        Logger.log(`Waiting for ${NO_OF_BLOCK_CONFIRMATIONS} confirmations...`);
        const txMined = await chainProvider.waitForTransaction(hash, NO_OF_BLOCK_CONFIRMATIONS);
        Logger.log(`${NO_OF_BLOCK_CONFIRMATIONS} blocks confirmed`);

        if (txMined.status !== 1) throw new Error("Mining Failed");
        return { response };
    } catch (error) {
        Logger.log(error, "<== Deposit to Farm Error!");
    }
}

const main = async () => {
    try {
        // 1. First harvest from LP farm
        await harvestFromFarm();
        // 2. Swap tokens
        await swapHalfVVSForUSDC();
        // 3. Add Liquidity
        await addVVSUSDCLP();
        // 4. Deposit to Farm
        await depositToFarm();
    } catch(error) {
        Logger.log(error, "<== Main Error!");
    }

}

main();

/* const testExports = {
    harvestFromFarm,
    swapHalfVVSForUSDC,
    addVVSUSDCLP,
    depositToFarm
} */