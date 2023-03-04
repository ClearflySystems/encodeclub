import * as helpers from "./helpers";
import * as dotenv from 'dotenv';
import {Ballot__factory} from "../typechain-types";
dotenv.config();

/**
 * yarn run ts-node --files ./scripts/DelegateVote_4.ts "ballotContractAddress" "delegatedVoterAddress"
 */
async function main() {

    // Check Contract Address passed
    const ballotContractAddress = helpers.getRequiredArg(0, "Missing Ballot contract address parameter");

    // Check Delegated voter address passed
    const delegatedVoterAddress = helpers.getRequiredArg(1, "Missing Delegated voter address parameter");
    console.log(`delegatedVoterAddress is ${delegatedVoterAddress}`);

    // Get Provider
    const provider = helpers.getTestnetProvider(1);

    // Check Private Key and connect Signer Wallet
    const privateKey = helpers.getRequiredEnvVar('PRIVATE_KEY');
    const signer = helpers.getConnectedSignerWallet(privateKey, provider);

    // Delegate My Vote to Voter - TODO update as delegate was removed from Ballot, so not sure what they intend should happen
    const ballotContractFactory = new Ballot__factory(signer);
    const ballotContract = ballotContractFactory.attach(ballotContractAddress);
    //const txReceipt =  await ballotContract.delegate(delegatedVoterAddress,{
    //    gasLimit: 100000
    //});
    //console.log(`vote receipt ${txReceipt.hash}`)

}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
