import * as helpers from "./helpers";
import * as dotenv from 'dotenv';
import { MyToken__factory } from "../typechain-types";
import { utils } from "ethers";
dotenv.config();

/**
 * yarn run ts-node --files ./scripts/GiveVotingTokens_2.ts "tokenContractAddress" "voterAddress" "amount"
 */
async function main() {

    // Check Token Contract Address passed
    const tokenContractAddress = helpers.getRequiredArg(0, "Missing Token contract address parameter");

    // Check Voter(s) address passed
    const voterAddress = helpers.getRequiredArg(1, "Missing Voter address parameter");
    if (!utils.isAddress(voterAddress)) throw new Error("Not a valid EVM address")

    // check amount passed
    const amount = helpers.getRequiredArg(2, "Missing amount parameter");
    if (Number(amount) < 0) throw new Error("Amount must be greater than 0")
    const amountToMint = utils.parseEther(amount)
    console.log(`amountToMint is ${amountToMint}`)
    // Get Provider
    const provider = helpers.getTestnetProvider(1);

    // Check Private Key and connect Signer Wallet
    const privateKey = helpers.getRequiredEnvVar('PRIVATE_KEY');
    const signer = helpers.getConnectedSignerWallet(privateKey, provider);

    // Mint Tokens to Voters
    const contract = new MyToken__factory(signer).attach(tokenContractAddress)
    const tx = await contract.mint(voterAddress, amountToMint, {gasLimit: 200000})
    const receipt = await tx.wait()

    if (receipt.status === 0) throw new Error(`Transaction failed: ${tx.hash}`)

    console.log(`Minted ${amount} tokens to ${signer.address} at block ${receipt.blockNumber}`)
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});