import { Ballot__factory } from "../typechain-types";
import * as helpers from "./helpers";
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Delegates votes using self wallet
 * Ex: yarn run ts-node --files ./scripts/DelegateVote_3.ts "0xFE4235a6e0877B887970A08409064ff4702CEc34" "0xbf0928FD32C01daF23316bc61FeE58365201B340"
 * param 1 being the contract address
 * param 2 being the voter address who will be delegated to
 */
async function main() {

    // Check Contract Address passed
    const ballotContractAddress = helpers.getRequiredArg(0, "Missing Ballot contract address parameter");

    // Check Delegated voter address passed
    const delegatedVoterAddress = helpers.getRequiredArg(1, "Missing Delegated voter address parameter");
    console.log(`delegatedVoterAddress is ${delegatedVoterAddress}`);

    // Setup Provider
    const provider = helpers.getTestnetProvider();

    // Check Private Key and connect Signer Wallet
    const privateKey = helpers.getRequiredEnvVar('PRIVATE_KEY');
    const signer = helpers.getConnectedSignerWallet(privateKey, provider);

    // Attach to existing contract
    const ballotContractFactory = new Ballot__factory(signer);
    const ballotContract = ballotContractFactory.attach(ballotContractAddress);
    const txReceipt =  await ballotContract.delegate(delegatedVoterAddress,{
        gasLimit: 100000
    });
    console.log(`vote receipt ${txReceipt.hash}`)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
