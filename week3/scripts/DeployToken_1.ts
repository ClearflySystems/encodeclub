import {MyToken__factory} from "../typechain-types";
import * as helpers from "./helpers";
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * yarn run ts-node --files ./scripts/DeployToken_1.ts
 */
async function main() {

    // Get Provider
    const provider = helpers.getTestnetProvider(1);

    // Check Private Key and connect Signer Wallet
    const privateKey = helpers.getRequiredEnvVar('PRIVATE_KEY');
    const signer = helpers.getConnectedSignerWallet(privateKey, provider);
    const balance = await signer.getBalance();
    console.log(`Wallet balance: ${balance} Wei`);

    // Deploy MyToken Contract
    console.log("Deploying MyToken contract");
    const myTokenContractFactory = new MyToken__factory(signer);
    const myTokenContract = await myTokenContractFactory.deploy();
    const myTokenDeployTx = await myTokenContract.deployTransaction.wait();
    console.log(`MyToken Contract deployed at: ${myTokenContract.address}`);
    console.log(myTokenDeployTx);

}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
