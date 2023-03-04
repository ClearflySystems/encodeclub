import { Ballot__factory } from "../typechain-types";
import * as helpers from "./helpers";
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Casts votes on smartcontract using voter private key
 * Ex: yarn run ts-node --files ./scripts/CastVote_4.ts "0xFE4235a6e0877B887970A08409064ff4702CEc34" "1"
 * param 1 being the contract address
 * param 2 is the proposal index
 */
async function main() {

    // Check Contract Address passed
    const ballotContractAddress = helpers.getRequiredArg(0, "Missing Ballot contract address parameter");

    // Check proposal index passed
    const proposalIndex = helpers.getRequiredArg(1, "Missing proposal Index parameter");
    console.log(`proposalIndex is ${proposalIndex}`)

    // Setup Provider
    const provider = helpers.getTestnetProvider();

    // Check Private Key and connect Signer Wallet
    const privateKey = helpers.getRequiredEnvVar('VOTER_PRIVATE_KEY');
    const signer = helpers.getConnectedSignerWallet(privateKey, provider);

    // Attach to existing contract
    const ballotContractFactory = new Ballot__factory(signer);
    const ballotContract = ballotContractFactory.attach(ballotContractAddress);
    const txReceipt =  await ballotContract.vote(proposalIndex,{
        gasLimit: 100000
    });
    console.log(`vote receipt ${txReceipt.hash}`)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
