import { ethers } from "ethers";
import { Ballot__factory } from "../typechain-types";
import * as dotenv from 'dotenv';
import * as helpers from "./helpers";
dotenv.config();

/**
 * yarn run ts-node --files ./scripts/GetWinner_6.ts "ballotContractAddress"
 * param 1 being the contract address
 */
async function main() {

    // Check Contract Address passed
    const ballotContractAddress = helpers.getRequiredArg(0, "Missing Ballot contract address parameter");

    // Setup Provider
    const provider = helpers.getTestnetProvider();

    // Check Private Key and connect Signer Wallet
    const privateKey = helpers.getRequiredEnvVar('PRIVATE_KEY');
    const signer = helpers.getConnectedSignerWallet(privateKey, provider);

    // Attach to existing contract
    const ballotContractFactory = new Ballot__factory(signer);
    const ballotContract = ballotContractFactory.attach(ballotContractAddress);
    const winnerAddress = await ballotContract.winnerName({
        gasLimit: 100000
    });
    const winnerName = ethers.utils.parseBytes32String(winnerAddress)
    console.log(`winnername ${winnerName}`)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
