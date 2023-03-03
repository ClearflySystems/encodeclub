import {expect} from "chai";
import {ethers} from "hardhat";
import {HelloWorld} from "../typechain-types";

describe("Hello world test1", () => {

    let helloWorldContract: HelloWorld;

    beforeEach(async () => {
        const HelloWorldFactory  = await ethers.getContractFactory("HelloWorld");
        helloWorldContract = await HelloWorldFactory.deploy();
        await helloWorldContract.deployed();
    });

    it("Should return Hello World!", async () => {
        const hello = await helloWorldContract.helloWorld();
        expect(hello).to.eq("Hello World!");
    });

    it("Owner should be the deployer", async () => {
        const signers = await ethers.getSigners();
        const deployerAccount = signers[0];
        const owner = await helloWorldContract.owner();
        // OR
        const signeraddress = await helloWorldContract.signer.getAddress();

        expect(owner).to.eq( deployerAccount.address );
        expect(owner).to.eq( signeraddress );
    });

    it("should prevent transfer of ownership", async () => {
        const signers = await ethers.getSigners();
        const signer2 = signers[1];
        await expect(
            helloWorldContract
                .connect( signer2 )
                .transferOwnership( signer2.address )
        ).to.be.revertedWith("Transfer blocked, Not owner");
    });
});
