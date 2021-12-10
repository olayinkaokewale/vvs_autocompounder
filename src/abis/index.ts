import { Contract, Wallet, providers } from 'ethers';
import { PK, RPC_URL, CHAIN_ID } from '../utils/config';
import craftsmanJson from './Craftsman.json';
import vvsRouterJson from './VVSRouter.json';
import iErc20Json from './IERC20.json';

const FARM_CONTRACT_ADDRESS = "0xdccd6455ae04b03d785f12196b492b18129564bc";
const VVS_ROUTER_ADDRESS = "0x145863eb42cf62847a6ca784e6416c1682b1b2ae";

const chainProvider = new providers.JsonRpcProvider(RPC_URL, { chainId: Number(CHAIN_ID), name:"Cronos" });
const account = new Wallet(PK, chainProvider);

const tokens = {
    VVS: {address:"0x2D03bECE6747ADC00E1a131BBA1469C15fD11e03", decimals:18},
    USDC: {address:"0xc21223249CA28397B4B6541dfFaEcC539BfF0c59", decimals:6}
}

const CraftsmanContract = new Contract(FARM_CONTRACT_ADDRESS, craftsmanJson.abi, account);
const VVSRouterContract = new Contract(VVS_ROUTER_ADDRESS, vvsRouterJson.abi, account);
const ERC20Interface = (tokenAddress:string) => new Contract(tokenAddress, iErc20Json.abi, account);

export {
    CraftsmanContract,
    VVSRouterContract,
    ERC20Interface,
    tokens
}