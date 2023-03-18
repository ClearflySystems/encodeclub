import {LotteryToken__factory} from "../typechain-types";
import {Lottery__factory} from "../typechain-types";
import * as helpers from "./helpers";
import * as dotenv from 'dotenv';
import {Wallet} from "ethers";
dotenv.config();

/**
 * yarn run ts-node --files ./scripts/deploy.ts
 */
async function main() {

    // Get Provider
    const provider = helpers.getTestnetProvider(1);

    // Check Private Key and connect Signer Wallet
    const privateKey = helpers.getRequiredEnvVar('PRIVATE_KEY');
    const signer = helpers.getConnectedSignerWallet(privateKey, provider);
    const balance = await signer.getBalance();
    console.log(`Wallet balance: ${balance} Wei`);


    //await deployContracts( signer );

}


async function deployContracts( signer: Wallet ){
    // Deploy Contract 1
    console.log("Deploying Token contract");
    const tokenContractFactory = new LotteryToken__factory(signer);
    const tokenContract = await tokenContractFactory.deploy('BLOTTO', 'BLT');

    // Get deployment transaction info
    const deployTokenTxReceipt = await tokenContract.deployTransaction.wait();
    console.log(`Token Contract deployed at: ${tokenContract.address}`);
    console.log(deployTokenTxReceipt);


    // Deploy Contract 2
    console.log("Deploying Token contract");
    const lotteryContractFactory = new Lottery__factory(signer);
    const lotteryContract = await lotteryContractFactory.deploy('BLOTTO', 'BLT', 100, 10, 2);

    // Get deployment transaction info
    const deployLotteryTxReceipt = await lotteryContract.deployTransaction.wait();
    console.log(`Token Contract deployed at: ${lotteryContract.address}`);
    console.log(deployLotteryTxReceipt);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
