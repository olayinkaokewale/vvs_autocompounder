import { config } from 'dotenv';
import { providers, Wallet } from 'ethers';
config();

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

