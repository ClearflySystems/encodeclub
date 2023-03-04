import {Ballot__factory} from "../typechain-types";
import * as helpers from "./helpers";
import * as dotenv from 'dotenv';
dotenv.config();

const PROPOSALS = ["Proposal 1", "Proposal 2", "Proposal 3"];

/**
 * yarn run ts-node --files ./scripts/Deployment_1.ts
 */
async function main() {

    // Get Provider
    const provider = helpers.getTestnetProvider();

    // Check Private Key and connect Signer Wallet
    const privateKey = helpers.getRequiredEnvVar('PRIVATE_KEY');
    const signer = helpers.getConnectedSignerWallet(privateKey, provider);
    const balance = await signer.getBalance();
    console.log(`Wallet balance: ${balance} Wei`);

    // Deploy Contract
    console.log("Deploying Ballot contract");
    const ballotContractFactory = new Ballot__factory(signer);
    const ballotContract = await ballotContractFactory.deploy(
        helpers.convertStringArrayToBytes32(PROPOSALS)
    );

    // Get deployment transaction info
    const deployTxReceipt = await ballotContract.deployTransaction.wait();
    console.log(`Contract deployed at: ${ballotContract.address}`);
    console.log(deployTxReceipt);
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
