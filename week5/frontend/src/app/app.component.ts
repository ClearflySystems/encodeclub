import {Component, ChangeDetectorRef} from '@angular/core';
import {metaMaskModule} from "./app.metamask";
import { BigNumber, Contract, ethers, providers, utils, Wallet } from 'ethers';

import tokenJson from '../assets/LotteryToken.json';
import lotteryJson from '../assets/LotteryContract.json';

import {environment} from "../../environments/environment";
const LOTTERY_TOKEN_ADDRESS = '0xa85cddc8308F870A4f365C9D7e4778eDA14F7590';
const LOTTERY_CONTRACT_ADDRESS = '0x7Cf2139aA78de20CCd0Ec2Db5108472f85eDE763';


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
   * @param http
   * @param cdr
   */
  constructor(private cdr: ChangeDetectorRef) {
    // Define our MetaMask Wallet Provider with angular view updater as callback
    this.metaMask = new metaMaskModule(() => cdr.detectChanges());
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

    this.lotteryStatus = {
      state: 'Unknown',
      currentBlockDate: 'N/A',
      closingTimeDate: 'N/A'
    }

  }

  /**
   * Get Lottery Status and closing date/time
   */
  async checkStatus(){
    if(this.lotteryContract) {
      this.lotteryStatus.state = 'Checking....';
      console.log('Getting Contract State');
      const state = await this.lotteryContract['betsOpen']();
      this.lotteryStatus.state = state? 'Open' : 'Closed';
      if (state) {
        const currentBlock = await this.defaultProvider.getBlock("latest");
        const closingTime = await this.lotteryContract['betsClosingTime']();
        this.lotteryStatus.currentBlockDate = new Date(currentBlock.timestamp * 1000);
        this.lotteryStatus.closingTimeDate = new Date(closingTime.toNumber() * 1000);
      }
    }else{
      alert('Error with LotteryContract');
    }
  }

  openbets(){
    alert('Open bets');
  }

  topupaccount(){
    alert('Topup yer account');
  }

  betwithaccount(){
    alert('Place yer bets');
  }

  closebets(){
    alert('Close bets');
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

}
