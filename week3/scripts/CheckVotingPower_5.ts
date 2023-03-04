import * as helpers from "./helpers";
import * as dotenv from 'dotenv';
import {Ballot__factory} from "../typechain-types";
dotenv.config();

/**
 * yarn run ts-node --files ./scripts/CheckVotingPower_5.ts "ballotContractAddress" "voterAddress"
 */
async function main() {

    // Check Contract Address passed
    const ballotContractAddress = helpers.getRequiredArg(0, "Missing Ballot contract address parameter");

    // TODO - make Voter Address optional and use msg.sender??
    const voterAddress = helpers.getRequiredArg(1, "Missing Voter address parameter");

    // Get Provider
    const provider = helpers.getTestnetProvider(1);

    // Check Private Key and connect Signer Wallet
    const privateKey = helpers.getRequiredEnvVar('PRIVATE_KEY');
    const signer = helpers.getConnectedSignerWallet(privateKey, provider);

    // Check My Voting Power
    const ballotContractFactory = new Ballot__factory(signer);
    const ballotContract = ballotContractFactory.attach(ballotContractAddress);
    const voterPower = await ballotContract.votingPower(voterAddress);
    console.log(`Voter Power: ${voterPower}`);
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
