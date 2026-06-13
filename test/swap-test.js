const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  // ===== Mainnet tokens =====
  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

  const fee = 3000;

  console.log("Deployer:", deployer.address);

  // ===== Deploy contract =====
  const SwapFactory = await ethers.getContractFactory("UniswapV3ETHSwapper");

  const swapper = await SwapFactory.deploy();
  await swapper.waitForDeployment();

  const swapperAddress = await swapper.getAddress();
  console.log("Swap contract:", swapperAddress);

  // ===== Attach tokens =====
  const dai = await ethers.getContractAt(
  "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
  DAI
);
  const usdc = await ethers.getContractAt(
  "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
  USDC
);

  // ===== DAI balance =====
  const daiBalance = await dai.balanceOf(deployer.address);
  console.log("DAI balance:", daiBalance.toString());

  if (daiBalance === 0n) {
    throw new Error("No DAI found in wallet (use fork with funds)");
  }

  // ===== Approve ALL DAI =====
  const approveTx = await dai.approve(swapperAddress, daiBalance);
  await approveTx.wait();

  console.log("DAI approved");

  // ===== Swap =====
  const tx = await swapper.swapTokenForToken(
    DAI,
    USDC,
    fee,
    daiBalance,
    0
  );

  await tx.wait();

  // ===== Final USDC =====
  const usdcBalance = await usdc.balanceOf(deployer.address);

  console.log("Final USDC:", usdcBalance.toString());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});