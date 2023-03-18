import detectEthereumProvider from '@metamask/detect-provider';
import { MetaMaskInpageProvider } from '@metamask/providers';
import {utils, providers} from "ethers";

declare global {
  interface Window {
    ethereum: providers.ExternalProvider
  }
}

interface IchainIds {
  [index: number]: string;
}
const chainIds: IchainIds = {
  1: 'Ethereum Main Network',
  3: 'Ropsten Test Network',
  4: 'Rinkeby Test Network',
  5: 'Goerli Test Network',
  42: 'Kovan Test Network',
  11155111: 'Sepola Test Network',
}

/// @title A simple MetaMask Connector
/// @author Simon Thomas
export class metaMaskModule {
  provider: MetaMaskInpageProvider | null | undefined;
  web3provider: providers.Web3Provider;
  userWalletAddress: string = '';
  userWalletNetwork: string = '';
  userEthBalance: number = 0;
  onUpdateCallback: Function;

  /**
   * Module Constructor - takes callback whenever wallet vars change
   * @param onUpdateCallback
   */
  constructor( onUpdateCallback:Function ) {
    this.web3provider = new providers.Web3Provider(window.ethereum);
    this.initMetaMaskProvider().catch(e => {
      console.log('Error initialising MetaMask Wallet Connection');
    });
    this.onUpdateCallback = onUpdateCallback;
  }

  /**
   * Setup MetaMask Provider with callbacks then connect.
   */
  async initMetaMaskProvider() {
    this.provider = await detectEthereumProvider();
    if(this.provider) {
      // Set Account switch callback
      this.web3provider.on('accountsChanged', (accounts: any) => {
        this.initLocalWallet(accounts);
      });
      // Set Network/Chain switch callback
      this.web3provider.on('chainChanged', (chainId: any) => {
        this.initLocalWallet([this.userWalletAddress]);
      });
      // Connect Wallet
      this.connectWallet();
    }
  }

  /**
   * Update Wallet Address, get balance and set network name
   * @param accounts
   */
  initLocalWallet(accounts: any) {
    if(this.provider && accounts.length) {
      this.userWalletAddress = accounts[0]; //await this.userWallet.getAddress();
      this.provider.request({
        method: "eth_getBalance",
        params: [this.userWalletAddress, 'latest']
      }).then(async (balanceBN: any) => {
        const balanceStr = utils.formatEther(balanceBN);
        this.userEthBalance = parseFloat(balanceStr.toString());
        // Update Network Name
        this.setWalletNetwork(this.provider?.networkVersion);
      });
    }
  }

  /**
   * Match ChainId to Network Name
   * @param chainId
   */
  setWalletNetwork(chainId: any) {
    const network = parseInt(chainId);
    this.userWalletNetwork = chainIds[network] || 'Unknown Network';
    // view refresh callback
    this.onUpdateCallback();
  }

  /**
   * Initial Call to connect MetaMask wallet using the eth_requestAccounts call
   */
  connectWallet() {
    if(this.provider) {
      this.provider.request({method: "eth_requestAccounts"}).then((accounts: any) => {
        this.initLocalWallet(accounts);
      });
    }
  }

  /**
   * Get MetaMask wallet as Signer
   */
  getSigner(){
    return this.web3provider.getSigner();
  }

}
