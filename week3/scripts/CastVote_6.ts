import * as helpers from "./helpers";
import * as dotenv from 'dotenv';
import {Ballot__factory} from "../typechain-types";
dotenv.config();

/**
 * yarn run ts-node --files ./scripts/CastVote_6.ts "ballotContractAddress" "proposalIndex" "votingPower"
 */
async function main() {

    // Check Contract Address passed
    const ballotContractAddress = helpers.getRequiredArg(0, "Missing Ballot contract address parameter");

    // Check proposal index passed - TODO cast as int??
    const proposalIndex = helpers.getRequiredArg(1, "Missing proposal Index parameter");
    console.log(`proposalIndex is ${proposalIndex}`);

    // Check voting amount passed - TODO cast as int??
    const votingPower = helpers.getRequiredArg(2, "Missing votingPower parameter");
    console.log(`Voting Power to pass is ${votingPower}`);

    // Get Provider
    const provider = helpers.getTestnetProvider();

    // Check Private Key and connect Signer Wallet
    const privateKey = helpers.getRequiredEnvVar('PRIVATE_KEY');
    const signer = helpers.getConnectedSignerWallet(privateKey, provider);

    // Cast My Vote
    const ballotContractFactory = new Ballot__factory(signer);
    const ballotContract = ballotContractFactory.attach(ballotContractAddress);
    const txReceipt =  await ballotContract.vote(proposalIndex, votingPower, {
        gasLimit: 100000
    });
    console.log(`vote receipt ${txReceipt.hash}`)
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
