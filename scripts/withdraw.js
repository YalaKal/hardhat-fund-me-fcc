const { getNamedAccounts, ethers } = require("hardhat")

async function main() {
  const { deployer } = getNamedAccounts()
  const fundMe = await ethers.getContract("FundMe", deployer)
  console.log(`Funding Contract ...`)

  const txResponse = await fundMe.withdraw()
  await txResponse.wait(1)
  console.log("Withdraw Done!!!!")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
