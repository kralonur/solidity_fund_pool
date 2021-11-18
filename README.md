# Solidity Fund Pool

## Functionality
This contract let's owner create multiple fund pool.

Contract owner can create fund pool's with the adress of fund pool owner.

Each fund pool has it's own state(like active, completed ...), and has it's only owner.

When the fund pool is closed the amount in the fund pool is send to fund owner.

Fund owner can be changed by contract owner.

Only the contract owner can create/launch/finish fund pool.

## Development

The contract is written with solidity.

Hardhat development environment being used to write this conract.

The test coverage is %100 (result from solidity-coverage).

For linting solhint and prettier is being used.

Contract could be deployed to rinkeby testnet using infura api key and wallet private key.
Environment file has to be created to use testnetwork and contract validation. (.env.example file contains example template)

Scripts folder contains the script for contract deployment.

For the easier contract interaction, hardhat tasks are created.
To see the list of tasks, write `npx hardhat` to the terminal.