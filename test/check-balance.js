const { formatEther } = require("ethers");
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  // ===== Mainnet tokens =====
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

  // IMPORTANT:
  // Use LINK token address (not LINK/ETH pool address)
  const LINK = "0xdAC17F958D2ee523a2206206994597C13D831ec7";


  console.log("Deployer:", deployer.address);


  // ===== Attach WETH + LINK =====
  const weth = await ethers.getContractAt(
    "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
    WETH
  );

  const link = await ethers.getContractAt(
    "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
    LINK
  );


  // =====================================================
  // STEP 2: Check WETH Balance
  // =====================================================

  const wethBalance = await link.balanceOf(deployer.address);

  console.log("Token balance:", ethers.formatEther(wethBalance));
  console.log("Eth balance:", ethers.formatEther(wethBalance));


  
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});