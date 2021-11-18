require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("solidity-coverage");
require("dotenv").config();

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    let balance = await account.getBalance();
    console.log(account.address + " - " + ethers.utils.formatEther(balance));
  }
});

task("create-fund-pool", "Creates a fund pool")
  .addParam("address", "The address of the contract")
  .addParam("fundowner", "The owner of the funds in the pool")
  .setAction(async (taskArgs, hre) => {
    const Fund = await ethers.getContractFactory("Fund");
    const fund = await Fund.attach(taskArgs.address);

    const createFundPoolTx = await fund.createFundPool(taskArgs.fundowner);
    await createFundPoolTx.wait();

    const poolId = await fund.fundIndex() - 1;

    console.log("Pool created with ID: " + poolId + " .Owner: " + taskArgs.fundowner);
  });

task("launch-fund-pool", "Launches a fund pool")
  .addParam("address", "The address of the contract")
  .addParam("poolid", "The id of the pool")
  .setAction(async (taskArgs, hre) => {
    const Fund = await ethers.getContractFactory("Fund");
    const fund = await Fund.attach(taskArgs.address);

    const launchFundPoolTx = await fund.launchFundPool(taskArgs.poolid);
    await launchFundPoolTx.wait();

    console.log("Launched pool ID:" + taskArgs.poolid);
  });

task("finish-fund-pool", "Finishes a fund pool")
  .addParam("address", "The address of the contract")
  .addParam("poolid", "The id of the pool")
  .setAction(async (taskArgs, hre) => {
    const Fund = await ethers.getContractFactory("Fund");
    const fund = await Fund.attach(taskArgs.address);

    const finishFundPoolTx = await fund.finishFundPool(taskArgs.poolid);
    await finishFundPoolTx.wait();

    console.log("Finished pool ID:" + taskArgs.poolid);
  });

task("info-fund-pool", "Finishes a fund pool")
  .addParam("address", "The address of the contract")
  .addParam("poolid", "The id of the pool")
  .setAction(async (taskArgs, hre) => {
    const Fund = await ethers.getContractFactory("Fund");
    const fund = await Fund.attach(taskArgs.address);

    [state, funders, fundOwner, totalFundedAmount] = await fund.getPoolInfo(taskArgs.poolid);

    const fundStateMapper = {
      0: "INACTIVE",
      1: "ACTIVE",
      2: "COMPLETED"
    }

    console.log("Pool state: " + fundStateMapper[state]);
    console.log("Pool funders: " + funders);
    console.log("Pool owner: " + fundOwner);
    console.log("Pool funded amount: " + totalFundedAmount);
  });

task("change-fund-owner", "Changes the owner of a funding pool")
  .addParam("address", "The address of the contract")
  .addParam("poolid", "The id of the pool")
  .addParam("newowner", "The id of the pool")
  .setAction(async (taskArgs, hre) => {
    const Fund = await ethers.getContractFactory("Fund");
    const fund = await Fund.attach(taskArgs.address);

    [, , oldFundOwner,] = await fund.getPoolInfo(taskArgs.poolid);

    const changeFundOwnerTx = await fund.changeFundOwner(taskArgs.poolid, taskArgs.newowner);
    await changeFundOwnerTx.wait();

    console.log("Changed owner of pool ID:" + taskArgs.poolid + " .From: " + oldFundOwner + " - To: " + taskArgs.newowner);
  });

task("total-fund", "Prints the total fund")
  .addParam("address", "The address of the contract")
  .addOptionalParam("type", "The type of fund to get [totalFundsCollected, totalActiveFunds, poolId]", "totalFundsCollected")
  .setAction(async (taskArgs, hre) => {
    const Fund = await ethers.getContractFactory("Fund");
    const fund = await Fund.attach(taskArgs.address);

    let fundToPrint;

    if (taskArgs.type == "totalFundsCollected") {
      fundToPrint = (await fund.totalFundsCollected()).toNumber();
    } else if (taskArgs.type == "totalActiveFunds") {
      fundToPrint = (await fund.totalActiveFunds()).toNumber();
    } else {
      const poolId = taskArgs.type;
      [, , , totalFundedAmount] = await fund.getPoolInfo(poolId);
      fundToPrint = totalFundedAmount.toNumber();
    }

    console.log(fundToPrint + " (" + ethers.utils.formatEther(fundToPrint) + " ether)");
  });

task("fund", "Prints the list of accounts")
  .addParam("address", "The address of the token")
  .addParam("poolid", "The id of the pool")
  .addParam("amount", "The amount")
  .setAction(async (taskArgs, hre) => {
    const Fund = await ethers.getContractFactory("Fund");
    const fund = await Fund.attach(taskArgs.address);

    const fundTx = await fund.fund(taskArgs.poolid, { "value": taskArgs.amount });
    await fundTx.wait();

    console.log("Pool ID: " + taskArgs.poolid + " .Funded: " + taskArgs.amount);
  });

const INFURA_KEY = process.env.INFURA_KEY || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [];
const ETHERSCAN_TOKEN = process.env.ETHERSCAN_TOKEN;

module.exports = {
  solidity: "0.8.4",
  networks: {
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/" + INFURA_KEY,
      accounts: PRIVATE_KEY
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_TOKEN
  }
};
