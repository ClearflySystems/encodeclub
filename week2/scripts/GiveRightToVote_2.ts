import { Ballot__factory } from "../typechain-types";
import * as helpers from "./helpers";
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Gives voting rights to addresses using chairperson key
 * yarn run ts-node --files ./scripts/GiveRightToVote_2.ts "0xFE4235a6e0877B887970A08409064ff4702CEc34" "0xC9aA59Bf68ff97fC67cDade3F20ed8220bF6762B" "0xc045Bbcab0CB395B5C0a76dEfE1B23111197fc00" "0x78bC6B775Eb95f0D049bEA9593C03dDFB3306e74"
 * param 1 being the contract address
 * all other parameters are addresses of voters
 */
async function main() {
    // Check Contract Address passed
    const ballotContractAddress = helpers.getRequiredArg(0, "Missing Ballot contract address parameter");

    const voters = process.argv.slice(3);
    if (voters.length <= 0) {
        throw new Error("Missing parameter: voters");
    }
    console.log(`voters are ${voters}`)

    // Get Provider
    const provider = helpers.getTestnetProvider();

    // Check Private Key and connect Signer Wallet
    const privateKey = helpers.getRequiredEnvVar('PRIVATE_KEY');
    const signer = helpers.getConnectedSignerWallet(privateKey, provider);

    // Attach to existing contract
    const ballotContractFactory = new Ballot__factory(signer);
    const ballotContract = ballotContractFactory.attach(ballotContractAddress);

    voters.map(async v => {
        console.log(`giving voting rights to ${v}`)
        const txReceipt = await ballotContract.giveRightToVote(v,{
            gasLimit: 100000
        })
        console.log(`Gave right to vote for ${v} and tx id is ${txReceipt.hash}`)
    });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
