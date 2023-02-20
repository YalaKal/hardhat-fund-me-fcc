const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { assert, expect } = require("chai")

const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async function () {
      let fundMe
      let deployer
      let mockV3Aggregator
      const sendValue = ethers.utils.parseEther("1")

      beforeEach(async function () {
        // Deploy our FundMe contract using hardhat

        // const accounts = await ethers.getSigners()
        // const accountZero = accounts[0]

        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])

        fundMe = await ethers.getContract("FundMe", deployer)
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        )
      })

      describe("constructor", async function () {
        it("sets the aggregator addresses correctly", async function () {
          const response = await fundMe.getPriceFeed()

          assert.equal(response, mockV3Aggregator.address)
        })
      })

      describe("fund", async function () {
        it("It fails if not enough ETH", async function () {
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          )
        })
        it("update the amount funded data structure", async function () {
          await fundMe.fund({ value: sendValue })
          const response = await fundMe.getAddressToAmountFunded(deployer)
          assert.equal(response.toString(), sendValue.toString())
        })
        it("add funder to array of funders", async function () {
          await fundMe.fund({ value: sendValue })
          const funder = await fundMe.getFunder(0)
          assert.equal(funder, deployer)
        })
      })

      describe("withdraw", async function () {
        beforeEach(async function () {
          await fundMe.fund({ value: sendValue })
        })
        it("Withdraw ETH from a single founder", async function () {
          // Arrange
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const startingOwnerBalance = await fundMe.provider.getBalance(
            deployer
          )

          // Act
          const txResponse = await fundMe.withdraw()
          const txReceipt = await txResponse.wait(1)

          // gasCost
          // Calculate the gas cost of the transaction
          const { gasUsed, effectiveGasPrice } = await txReceipt

          const gasCost = gasUsed.mul(effectiveGasPrice)
          // Assert
          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingOwnerBalancer = await fundMe.provider.getBalance(deployer)
          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            startingFundMeBalance.add(startingOwnerBalance).toString(),
            endingOwnerBalancer.add(gasCost).toString()
          )
        })
        it("Allows us to withdraw with multiple funders", async function () {
          // Arrange
          const accounts = await ethers.getSigners()

          for (let i = 1; i <= 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i])
            await fundMeConnectedContract.fund({ value: sendValue })
          }

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const startingOwnerBalance = await fundMe.provider.getBalance(
            deployer
          )

          // Act
          const txResponse = await fundMe.withdraw()
          const txReceipt = await txResponse.wait(1)
          // Calculate the gas cost of the transaction
          const { gasUsed, effectiveGasPrice } = await txReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice)

          // Assert
          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingOwnerBalancer = await fundMe.provider.getBalance(deployer)
          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            startingFundMeBalance.add(startingOwnerBalance).toString(),
            endingOwnerBalancer.add(gasCost).toString()
          )
          // Make sure funders are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted

          for (let i = 1; i <= 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            )
          }
        })
        it("Only Oallows the owner to withdraw", async function () {
          const accounts = await ethers.getSigners()
          const attacker = accounts[1]
          const attackerConnectedContract = await fundMe.connect(attacker)
          await expect(attackerConnectedContract.withdraw()).to.be.revertedWith(
            "FundMe__NotOwner"
          )
        })
        it("cheaperWithdraw ETH from a single founder", async function () {
          // Arrange
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const startingOwnerBalance = await fundMe.provider.getBalance(
            deployer
          )

          // Act
          const txResponse = await fundMe.cheaperWithdraw()
          const txReceipt = await txResponse.wait(1)

          // gasCost
          // Calculate the gas cost of the transaction
          const { gasUsed, effectiveGasPrice } = await txReceipt

          const gasCost = gasUsed.mul(effectiveGasPrice)
          // Assert
          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingOwnerBalancer = await fundMe.provider.getBalance(deployer)
          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            startingFundMeBalance.add(startingOwnerBalance).toString(),
            endingOwnerBalancer.add(gasCost).toString()
          )
        })
        it("chearperWithdraw Testing ...", async function () {
          // Arrange
          const accounts = await ethers.getSigners()

          for (let i = 1; i <= 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i])
            await fundMeConnectedContract.fund({ value: sendValue })
          }

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const startingOwnerBalance = await fundMe.provider.getBalance(
            deployer
          )

          // Act
          const txResponse = await fundMe.cheaperWithdraw()
          const txReceipt = await txResponse.wait(1)
          // Calculate the gas cost of the transaction
          const { gasUsed, effectiveGasPrice } = await txReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice)

          // Assert
          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingOwnerBalancer = await fundMe.provider.getBalance(deployer)
          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            startingFundMeBalance.add(startingOwnerBalance).toString(),
            endingOwnerBalancer.add(gasCost).toString()
          )
          // Make sure funders are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted

          for (let i = 1; i <= 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            )
          }
        })
      })
    })
