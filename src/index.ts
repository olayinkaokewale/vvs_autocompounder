import { config } from 'dotenv';
config();

import { providers, Wallet, BigNumber, utils } from 'ethers';
import { CraftsmanContract, ERC20Interface, tokens, VVSRouterContract } from './abis';

import { CHAIN_ID, PK, RPC_URL } from "./utils/config";
import Logger from "./utils/logger";

const chainProvider = new providers.JsonRpcProvider(RPC_URL, { chainId: Number(CHAIN_ID), name:"Cronos" });
const account = new Wallet(PK, chainProvider);


// Test if it is going
chainProvider.getBlockNumber().then((result) => {
    Logger.log("Current block number: " + result);
    Logger.log(account.address, "<== Address");
});
// Done

/* const testCraftsman = async () => {
    try {
        const response = await CraftsmanContract.poolLength();
        Logger.log(BigNumber.from(response).toString());
    } catch(err) {
        Logger.log(err, "<== Error");
    }
}

testCraftsman(); */

/* const testRouter = async () => {
    try {

        const VVSTokenContract = await ERC20Interface(tokens.VVS.address);
        const response2 = await VVSTokenContract.balanceOf('0x82F25c3343E8ab407319De8DfE20f9925cEcb8Eb');
        const halfedVVSAmount = BigNumber.from(response2).div(2).toString();
        Logger.log(halfedVVSAmount, "<== Halfed Amount in Account");

        const response = await VVSRouterContract.getAmountsOut(halfedVVSAmount,  [tokens.VVS.address, tokens.USDC.address ]);
        if (response && response.length > 0) {
            response.forEach((res:any, id:number) => {
                Logger.log(BigNumber.from(res).toString(), "<==", id);
            });
        }
        const [ amountIn, amountOut ] = response;
        Logger.log(BigNumber.from(amountOut).div(1000).mul(995).toString(), "// 0.5% slippage");

    } catch(err) {
        Logger.log(err, "<== Error");
    }
}

testRouter(); */

// Now create all the functions here according to step in todo file

// 1. Function to harvest from the LP farm
const POOL_ID = 5; // Pool ID for VVS-USDC Farm Pool
const harvestFromLp = async () => {
    try {
        // This will harvest the VVS from the pool
        const response = await CraftsmanContract.deposit(POOL_ID, 0);
        Logger.log(response);
        return {
            response
        }
    } catch(err) {
        Logger.log(err, "<== Error");
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


const main = async () => {
    // 1. First harvest from LP farm
    // await harvestFromLp();
    // await swapHalfVVSForUSDC();
}

// main();

const testExports = {
    harvestFromLp,
    swapHalfVVSForUSDC
}