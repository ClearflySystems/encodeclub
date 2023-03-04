import * as helpers from "./helpers";
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * yarn run ts-node --files ./scripts/GiveVotingTokens_2.ts "tokenContractAddress" "voterAddress"
 */
async function main() {

    // Check Token Contract Address passed
    const tokenContractAddress = helpers.getRequiredArg(0, "Missing Token contract address parameter");

    // Check Voter(s) address passed

    // Get Provider
    const provider = helpers.getTestnetProvider();

    // Check Private Key and connect Signer Wallet
    const privateKey = helpers.getRequiredEnvVar('PRIVATE_KEY');
    const signer = helpers.getConnectedSignerWallet(privateKey, provider);

    // Mint Tokens to Voters
    // TODO
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
