const hre = require("hardhat");


async function main() {
    [owner] = await hre.ethers.getSigners();
    const Fund = await hre.ethers.getContractFactory("Fund");
    const fund = await Fund.deploy(owner.address);

    await fund.deployed();

    console.log("Fund deployed to:", fund.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });