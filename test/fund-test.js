const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Fund", function () {

    let owner, accounts;
    let fund;

    before(async function () {
        accounts = await ethers.getSigners();
        owner = accounts[0];
    });

    before(async function () {
        const Fund = await ethers.getContractFactory("Fund");
        await expect(Fund.deploy(ethers.constants.AddressZero))
            .to.be.revertedWith('Owner adress cannot be zero!');
    });

    beforeEach(async function () {
        const Fund = await ethers.getContractFactory("Fund");
        fund = await Fund.deploy(owner.address);
        await fund.deployed();
    });

    it("Should create fundPool with fundOwner address", async function () {
        await expect(fund.createFundPool(ethers.constants.AddressZero))
            .to.be.revertedWith('Fund owner adress cannot be zero!');

        const createFundPoolTx = await fund.createFundPool(owner.address);
        await createFundPoolTx.wait();

        const fundIndex = await fund.fundIndex();

        expect(fundIndex)
            .to.equal(1);

        const latestFundIndex = fundIndex - 1;

        [, , fundOwner,] = await fund.getPoolInfo(latestFundIndex);

        expect(fundOwner)
            .to.equal(owner.address);
    });

    it("Should raise exception when pool does not exists", async function () {
        await expect(fund.launchFundPool(0))
            .to.be.revertedWith('This pool does NOT exists!');

        const createFundPoolTx = await fund.createFundPool(owner.address);
        await createFundPoolTx.wait();

        await expect(fund.launchFundPool(0))
            .to.not.be.reverted;
    });

    it("Should raise exception when launching while fundState is not inactive", async function () {
        const createFundPoolTx = await fund.createFundPool(owner.address);
        await createFundPoolTx.wait();

        const latestFundIndex = await fund.fundIndex() - 1;

        // Make fundState active
        await expect(fund.launchFundPool(latestFundIndex))
            .to.not.be.reverted;

        // Make fundState completed
        const finishFundPoolTx = await fund.finishFundPool(latestFundIndex);
        await finishFundPoolTx.wait();

        await expect(fund.launchFundPool(latestFundIndex))
            .to.be.revertedWith('Fund state has to be inactive to launch!');
    });

    it("Should launch fundPool", async function () {
        const createFundPoolTx = await fund.createFundPool(owner.address);
        await createFundPoolTx.wait();

        const latestFundIndex = await fund.fundIndex() - 1;

        const launchFundPoolTx = await fund.launchFundPool(latestFundIndex);
        await launchFundPoolTx.wait();

        [state, , ,] = await fund.getPoolInfo(latestFundIndex);

        // 1 stands for FundState.ACTIVE
        expect(state)
            .to.equal(1);
    });

    it("Should change fundOwner", async function () {
        const createFundPoolTx = await fund.createFundPool(owner.address);
        await createFundPoolTx.wait();

        const latestFundIndex = await fund.fundIndex() - 1;

        [, , oldFundOwner,] = await fund.getPoolInfo(latestFundIndex);

        expect(oldFundOwner)
            .to.equal(owner.address);

        await expect(fund.changeFundOwner(latestFundIndex, ethers.constants.AddressZero))
            .to.be.revertedWith('Fund owner adress cannot be zero!');

        const changeFundOwnerTx = await fund.changeFundOwner(latestFundIndex, accounts[1].address);
        await changeFundOwnerTx.wait();

        [, , newFundOwner,] = await fund.getPoolInfo(latestFundIndex);

        expect(newFundOwner)
            .to.equal(accounts[1].address);
    });

    it("Should raise exception when funding while fundState is not active", async function () {
        const createFundPoolTx = await fund.createFundPool(owner.address);
        await createFundPoolTx.wait();

        const latestFundIndex = await fund.fundIndex() - 1;
        const amountToFund = ethers.utils.parseEther("0.001");

        await expect(fund.fund(latestFundIndex, { value: amountToFund }))
            .to.be.revertedWith('Fund state is not active!');

        // Make fundState active
        const launchFundPoolTx = await fund.launchFundPool(latestFundIndex);
        await launchFundPoolTx.wait();

        await expect(fund.fund(latestFundIndex, { value: amountToFund }))
            .to.not.be.reverted;
    });

    it("Should update funders of pool after fund method called", async function () {
        const createFundPoolTx = await fund.createFundPool(owner.address);
        await createFundPoolTx.wait();

        const latestFundIndex = await fund.fundIndex() - 1;
        const amountToFund = ethers.utils.parseEther("0.001");

        const launchFundPoolTx = await fund.launchFundPool(latestFundIndex);
        await launchFundPoolTx.wait();

        // Fund with owner account

        let fundTx = await fund.fund(latestFundIndex, { value: amountToFund });
        await fundTx.wait();

        [, funders, ,] = await fund.getPoolInfo(latestFundIndex);
        expect(funders)
            .to.contain(owner.address);

        // Fund with accounts[1]

        fundTx = await fund.connect(accounts[1]).fund(latestFundIndex, { value: amountToFund });
        await fundTx.wait();

        [, funders, ,] = await fund.getPoolInfo(latestFundIndex);

        expect(funders)
            .to.contain(owner.address, accounts[1].address);

        // Fund again with accounts[1]

        fundTx = await fund.connect(accounts[1]).fund(latestFundIndex, { value: amountToFund });
        await fundTx.wait();

        [, funders, ,] = await fund.getPoolInfo(latestFundIndex);

        // Same accounts should not be added again, that is why array length should be 2 after same account funded
        expect(funders.length)
            .to.equal(2);
    });

    it("Should update fund related fields after fund method called", async function () {
        const createFundPoolTx = await fund.createFundPool(owner.address);
        await createFundPoolTx.wait();

        const latestFundIndex = await fund.fundIndex() - 1;
        let amountToFund = ethers.utils.parseEther("0.001");

        const launchFundPoolTx = await fund.launchFundPool(latestFundIndex);
        await launchFundPoolTx.wait();

        let fundTx = await fund.fund(latestFundIndex, { value: amountToFund });
        await fundTx.wait();

        [, , , totalFundedAmount] = await fund.getPoolInfo(latestFundIndex);


        let amountToExpect = ethers.utils.parseEther("0.001");

        expect(totalFundedAmount)
            .to.equal(amountToExpect);
        expect(await fund.totalFundsCollected())
            .to.equal(amountToExpect);
        expect(await fund.totalActiveFunds())
            .to.equal(amountToExpect);

        // Repeat same steps to see if increment is working

        amountToFund = ethers.utils.parseEther("0.002");

        fundTx = await fund.fund(latestFundIndex, { value: amountToFund });
        await fundTx.wait();

        [, , , totalFundedAmount] = await fund.getPoolInfo(latestFundIndex);

        amountToExpect = ethers.utils.parseEther("0.003");

        expect(totalFundedAmount)
            .to.equal(amountToExpect);
        expect(await fund.totalFundsCollected())
            .to.equal(amountToExpect);
        expect(await fund.totalActiveFunds())
            .to.equal(amountToExpect);
    });

    it("Should raise exception when finishing pool while fundState is not active", async function () {
        const createFundPoolTx = await fund.createFundPool(owner.address);
        await createFundPoolTx.wait();

        const latestFundIndex = await fund.fundIndex() - 1;

        // At this state fundState inactive
        await expect(fund.finishFundPool(latestFundIndex))
            .to.be.revertedWith('Fund state is not active!');

        // Make fundState active
        const launchFundPoolTx = await fund.launchFundPool(latestFundIndex);
        await launchFundPoolTx.wait();

        await expect(fund.finishFundPool(latestFundIndex))
            .to.not.be.reverted;
    });

    it("Should send funds to fundOwner after finishFundPool method called", async function () {
        // Make accounts[1] poolOwner       
        const createFundPoolTx = await fund.createFundPool(accounts[1].address);
        await createFundPoolTx.wait();

        const latestFundIndex = await fund.fundIndex() - 1;
        let amountToFund = ethers.utils.parseEther("0.001");

        const launchFundPoolTx = await fund.launchFundPool(latestFundIndex);
        await launchFundPoolTx.wait();

        // Funding should decrease funders ether balance by amountToFund
        await expect(await fund.fund(latestFundIndex, { value: amountToFund }))
            .to.changeEtherBalance(owner, -amountToFund);

        // FinishFundPool should decrease funders ether balance by amountToFund
        await expect(await fund.finishFundPool(latestFundIndex))
            .to.changeEtherBalance(accounts[1], amountToFund);

    });

    it("Should update fund related fields after finishFundPool method called", async function () {
        // Create 2 fund pools 
        let createFundPoolTx = await fund.createFundPool(accounts[1].address);
        await createFundPoolTx.wait();
        createFundPoolTx = await fund.createFundPool(accounts[2].address);
        await createFundPoolTx.wait();

        const firstFundIndex = await fund.fundIndex() - 2;
        const secondFundIndex = await fund.fundIndex() - 1;

        // Launch 2 fund pools 
        let launchFundPoolTx = await fund.launchFundPool(firstFundIndex);
        await launchFundPoolTx.wait();
        launchFundPoolTx = await fund.launchFundPool(secondFundIndex);
        await launchFundPoolTx.wait();

        const amountToFund = ethers.utils.parseEther("0.001");

        // Fund 2 fund pools
        let fundTx = await fund.fund(firstFundIndex, { value: amountToFund });
        await fundTx.wait();
        fundTx = await fund.fund(secondFundIndex, { value: amountToFund });
        await fundTx.wait();

        const finishFirstFundPoolTx = await fund.finishFundPool(firstFundIndex);
        await finishFirstFundPoolTx.wait();

        // After first fund pool finished; 

        [, , , firstTotalFundedAmount] = await fund.getPoolInfo(firstFundIndex);
        [, , , secondTotalFundedAmount] = await fund.getPoolInfo(secondFundIndex);

        // TotalFundedAmount of firstFundPool should be zero
        expect(firstTotalFundedAmount)
            .to.equal(0);
        // TotalFundedAmount of secondFundPool shouldn't be affected
        expect(secondTotalFundedAmount)
            .to.equal(amountToFund);

        // TotalFundsCollected should not be affected after fund pool finished (0.002 eth in this case) 
        expect(await fund.totalFundsCollected())
            .to.equal(ethers.utils.parseEther("0.002"));

        // TotalActiveFunds should be total funds in the whole contract as of now
        expect(await fund.totalActiveFunds())
            .to.equal(ethers.utils.parseEther("0.001"));


        const finishSecondFundPoolTx = await fund.finishFundPool(secondFundIndex);
        await finishSecondFundPoolTx.wait();

        // After second fund pool finished; 

        [, , , firstTotalFundedAmount] = await fund.getPoolInfo(firstFundIndex);
        [, , , secondTotalFundedAmount] = await fund.getPoolInfo(secondFundIndex);

        // TotalFundedAmount of firstFundPool should still be zero
        expect(firstTotalFundedAmount)
            .to.equal(0);
        // TotalFundedAmount of secondFundPool should be zero now
        expect(secondTotalFundedAmount)
            .to.equal(0);

        // TotalFundsCollected should not be affected after second fund pool finished too (0.002 eth in this case) 
        expect(await fund.totalFundsCollected())
            .to.equal(ethers.utils.parseEther("0.002"));

        // TotalActiveFunds should be total funds in the whole contract as of now (0 after both pools are finished)
        expect(await fund.totalActiveFunds())
            .to.equal(0);
    });
});