import {Component, ChangeDetectorRef} from '@angular/core';
import {metaMaskModule} from "./app.metamask";
import { BigNumber, Contract, ethers, providers, utils, Wallet } from 'ethers';

import tokenJson from '../assets/LotteryToken.json';
import lotteryJson from '../assets/LotteryContract.json';

import {environment} from "../../environments/environment";
const LOTTERY_TOKEN_ADDRESS = '0xc658f73a856F2D9e3ACb7fD6a1F51483DD411647';
const LOTTERY_CONTRACT_ADDRESS = '0xDd7925285d273AF86C460fB704A5345c0fB44631';
const TOKEN_RATIO = 1000000;


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent{
  metaMask: metaMaskModule;
  defaultProvider: providers.Provider;
  tokenContractAddress: string;
  tokenContract: Contract | undefined;
  lotteryContractAddress: string;
  lotteryContract: Contract | undefined;
  lotteryStatus: any



  /**
   * App Component Constructor
   * @param cdr
   */
  constructor(private cdr: ChangeDetectorRef) {
    // Define our MetaMask Wallet Provider with angular view updater as callback
    this.metaMask = new metaMaskModule(() => this.refreshUI());
    // Setup a Metamask Web3 provider
    this.defaultProvider = this.metaMask.web3provider;
    //this.defaultProvider = new ethers.providers.AlchemyProvider('goerli', environment.ALCHEMY_API_KEY);

    // Set Contract Addresses
    this.tokenContractAddress = LOTTERY_TOKEN_ADDRESS;
    this.lotteryContractAddress = LOTTERY_CONTRACT_ADDRESS;

    // Set Token Contract Object
    this.tokenContract = new Contract(
      this.tokenContractAddress,
      tokenJson.abi,
      this.defaultProvider
    );

    // Set Lottery Contract Object
    this.lotteryContract = new Contract(
      this.lotteryContractAddress,
      lotteryJson.abi,
      this.defaultProvider
    );

    // Object to store lottery status view vars
    this.lotteryStatus = {
      owner: '',
      state: 0,
      tokens: 0,
      currentBlockDate: 'N/A',
      closingTimeDate: 'N/A'
    }

  }

  /**
   * Get Lottery Status and closing date/time
   */
  async checkStatus(){
    if(this.lotteryContract) {
      this.lotteryStatus.state = 3;
      console.log('Getting Contract State');
      const state = await this.lotteryContract['betsOpen']();
      this.lotteryStatus.state = state? 1 : 2;
      if (state) {
        const currentBlock = await this.defaultProvider.getBlock("latest");
        const closingTime = await this.lotteryContract['betsClosingTime']();
        this.lotteryStatus.currentBlockDate = new Date(currentBlock.timestamp * 1000);
        this.lotteryStatus.closingTimeDate = new Date(closingTime.toNumber() * 1000);
      }
      const owner = await this.lotteryContract['owner']();
      this.lotteryStatus.owner = owner.toString().toLowerCase() == this.metaMask.userWalletAddress.toString().toLowerCase();
    }else{
      alert('Error with LotteryContract');
    }
  }

  /**
   * Open Lottery for placing bets
   * @param datetime
   */
  async openbets( datetime: any ){
    const now = new Date();
    const closing = Date.parse(datetime);
    if(isNaN(closing) || closing < (now.getTime() + 600000)){
      alert('Please set a date/time that is in the future and more than 10 minutes');
    }else{
      if(this.lotteryContract) {
        const connectContract = this.lotteryContract.connect(this.metaMask.getSigner());
        const openLottery = await connectContract['openBets']( closing / 1000);
        console.log(openLottery);
        await this.checkStatus();
      }else{
        alert('Error with LotteryContract');
      }
    }
  }

  /**
   * Purchase Lottery Tokens from MetaMask Wallet
   */
  async topupaccount(amount:string = "10"){
    let tokensOrdered = parseInt(amount);
    if(!tokensOrdered || isNaN(tokensOrdered)){
      alert('Invalid Token Amount');
      return;
    }
   
    if(this.lotteryContract) {
      const connectContract = this.lotteryContract.connect(this.metaMask.getSigner());
      const tx = await connectContract['purchaseTokens']({
        value: ethers.utils.parseEther(amount).div(TOKEN_RATIO),
    });
      const rcpt = tx.wait();
      console.log(rcpt);
      await this.checkStatus();
    }else{
      alert('Error with LotteryContract');
    }
  }

  /**
   * Close Lottery to any further bets
   */
  async closebets(){
    if(this.lotteryContract) {
      const closeLottery = await this.lotteryContract['closeLottery']();
      console.log(closeLottery);
      await this.checkStatus();
    }else{
      alert('Error with LotteryContract');
    }
  }

  async betwithaccount(){
    if(this.lotteryContract) {
      const allowTx = await this.tokenContract?.connect(this.metaMask.getSigner())['approve'](this.metaMask.userWalletAddress, ethers.constants.MaxUint256);
      await allowTx.wait();
      const state = await this.lotteryContract['betsOpen']();
      if(state){
        const connectContract = this.lotteryContract.connect(this.metaMask.getSigner());
        const tx = await connectContract['bet']();
        const rcpt = tx.wait();
        console.log(rcpt);
        await this.checkStatus();
      }else{
        alert('lottery closed')
      }

    }
  }

  checkplayprize(){
    alert('Check prize');
  }


  showmethemoney(){
    alert('Show me the Money!!!');
  }

  burnbabyburn(){
    alert('Burn baby burn!!!');
  }

  /**
   * Getter for Lottery Status Label
   */
  getLotterStateLabel(){
    switch(this.lotteryStatus.state){
      case 1: return 'Open';
      case 2: return 'Closed';
      case 3: return 'Checking';
      default: return 'Unknown';
    }
  }

  /**
   * Callback function to refresh angular UI after external updates.
   */
  async refreshUI(){
    if(this.lotteryStatus.state !== 0){
      await this.checkStatus();
    }
    this.cdr.detectChanges();
  }
}
