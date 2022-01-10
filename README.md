# VVS Autocompounder Script
This script autocompounds VVS farm by harvesting VVS from the farm, selling half of it, 
adding liquidity to the VVS-USDC pool and adding the LP token to the farm. Note that this project is completely free and open source.

---

## Prerequisite
1. Node Js
2. NPM or yarn
3. Already has VVS-USDC LP staked in farm
4. Have CRO in your account for gas fees

---

## How to run
1. Clone this repo
2. From the root of this project, get all necessary packages by running `yarn` or `npm install`
3. Place your private key in the .env file and, **[NOTE: Never commit your private key - always delete after running the script]**
4. Run `npm start` or `yarn start` to run the script.

---

## Todo
1. Allow connection with Metamask and other wallet providers (To avoid private key exposure)
2. Create test scripts for testnet
3. Create a GUI for easy user experience.
4. Create a contract that uses the flow of this script to run the autocompounding (Most likely in another project)

---

## Contribute
Contribute to this project by creating issues and making a PR to add to it.