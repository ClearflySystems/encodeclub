import {Ballot__factory} from "../typechain-types";
import * as helpers from "./helpers";
import * as dotenv from 'dotenv';
dotenv.config();

const PROPOSALS = ["Proposal 1", "Proposal 2", "Proposal 3"];

/**
 * yarn run ts-node --files ./scripts/DeployBallot_3.ts "tokenContractAddress" "targetBlockNumber"
 */
async function main() {

    // Check Token Contract Address passed
    const tokenContractAddress = helpers.getRequiredArg(0, "Missing Token contract address parameter");

    // Check Target Block number passed
    const targetBlockNumber = helpers.getRequiredArg(1, "Missing Target Block parameter");

    // Get Provider
    const provider = helpers.getTestnetProvider(1);

    // Check Private Key and connect Signer Wallet
    const privateKey = helpers.getRequiredEnvVar('PRIVATE_KEY');
    const signer = helpers.getConnectedSignerWallet(privateKey, provider);

    // Deploy Ballot Contract
    console.log("Deploying Ballot contract");
    const ballotContractFactory = new Ballot__factory(signer);
    const ballotContract = await ballotContractFactory.deploy(
        helpers.convertStringArrayToBytes32(PROPOSALS),
        tokenContractAddress,
        targetBlockNumber
    );
    const ballotContractDeployTx = await ballotContract.deployTransaction.wait();
    console.log(`Ballot Contract deployed at: ${ballotContract.address}`);
    console.log(ballotContractDeployTx);
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
