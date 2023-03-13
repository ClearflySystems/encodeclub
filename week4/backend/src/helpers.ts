import {ethers, Wallet} from "ethers";
import {Provider} from "@ethersproject/providers";

/**
 * Get required argument at index (ignoring first 2 node env args)
 * Optional error message
 * @param index
 * @param msg
 */
export function getRequiredArg(index?: number, msg?: string): string {
    throw new Error("Function not implemented.");
}

/**
 * Check we have the required number of arguments (ignoring first 2 node env args)
 * @param count
 * @param msg
 */
export function getRequiredArgs(count?: number, msg?: string): string[] {
    throw new Error("Function not implemented.");
}

/**
 * Check Env Var is present and populated otherwise throw error message
 * @param envar
 * @param msg
 */
export function getRequiredEnvVar(envar: string, msg?: string): string {
    throw new Error("Function not implemented.");
}

/**
 * Convert Array of Stings to Bytes32Array
 * @param array
 */
export function convertStringArrayToBytes32(array: string[]): any[] {
    throw new Error("Function not implemented.");
}

/**
 * Get TestNet provider
 * 0 - Default Provider
 * 1 - Alchemy
 * 2 - Etherscan
 * @param index
 * @param testnet - default goerli
 */
export function getTestnetProvider(index?: number, testnet?: string): Provider {
    throw new Error("Function not implemented.");
}

/**
 * Connect Wallet with privateKey to provider and return signer wallet
 * @param privateKey
 * @param provider
 */
export function getConnectedSignerWallet(privateKey: string, provider: Provider): Wallet {
    throw new Error("Function not implemented.");
}

/**
 * Module Exports
 */
module.exports = {

    getRequiredArg: (i: number, msg: string): string => {
        const args = process.argv.slice(2);
        if(args[i]) return args[i];
        else throw new Error(msg || `Missing parameters at index: ${i}`);
    },

    getRequiredArgs: (count: number, msg: string): string[] => {
        const args = process.argv.slice(2);
        if(args.length === 0 || args.length !== count){
            throw new Error(msg || `Missing parameters`);
        }
        return args;
    },

    getRequiredEnvVar: (envar: string, msg: string): string => {
        const thevar = process.env[envar];
        if(typeof thevar === 'undefined' || thevar.toString().length === 0){
            throw new Error(msg || `Missing Environment variable: ${envar}`);
        }
        return thevar;
    },

    convertStringArrayToBytes32: (array: string[]): any[] => {
        const bytes32Array = [];
        for (let index = 0; index < array.length; index++) {
            bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
        }
        return bytes32Array;
    },

    getTestnetProvider: (p: number, testnet: string = "goerli"): Provider => {
        switch (p) {
            case 1:
                return new ethers.providers.AlchemyProvider(testnet, module.exports.getRequiredEnvVar('ALCHEMY_API_KEY') );
            case 2:
                return new ethers.providers.EtherscanProvider(testnet, module.exports.getRequiredEnvVar('ETHERSCAN_API_KEY') );
            default:
                return ethers.getDefaultProvider(testnet);
        }
    },

    getConnectedSignerWallet: (privateKey: string, provider: Provider): Wallet => {
        const wallet = new ethers.Wallet(privateKey);
        console.log(`Connected to the wallet address ${wallet.address}`);
        return wallet.connect(provider);
    }
}

