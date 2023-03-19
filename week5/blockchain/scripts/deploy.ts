import {LotteryToken__factory} from "../typechain-types";
import {Lottery__factory} from "../typechain-types";
import * as helpers from "./helpers";
import * as dotenv from 'dotenv';
import {Wallet} from "ethers";
import {ethers} from "hardhat";
dotenv.config();

const BET_PRICE = 1;
const BET_FEE = 0.2;
const TOKEN_RATIO = 1;

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
    // Deploy Contract 2
    console.log("Deploying Token contract");
    const lotteryContractFactory = new Lottery__factory(signer);
    const lotteryContract = await lotteryContractFactory.deploy(
        'BLOTTO',
        'BLT',
        TOKEN_RATIO,
        ethers.utils.parseEther(BET_PRICE.toFixed(18)),
        ethers.utils.parseEther(BET_FEE.toFixed(18))
    );

    // Get deployment transaction info
    const deployLotteryTxReceipt = await lotteryContract.deployTransaction.wait();
    console.log(`Lottery Contract deployed at: ${lotteryContract.address}`);
    console.log(deployLotteryTxReceipt);


    // Attach Token Contract
    console.log("Attaching Token contract");
    const tokenAddress = await lotteryContract.paymentToken();
    const tokenContractFactory = new LotteryToken__factory(signer);
    const token = tokenContractFactory.attach(tokenAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
