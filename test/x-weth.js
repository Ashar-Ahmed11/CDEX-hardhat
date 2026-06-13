const { formatEther } = require("ethers");
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  // ===== Mainnet tokens =====
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

  // IMPORTANT:
  // Use LINK token address (not LINK/ETH pool address)
  const LINK = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

  const fee = 500; // WETH/LINK usually uses 0.3% pool

  console.log("Deployer:", deployer.address);

  // ===== Deploy contract =====
  const SwapFactory = await ethers.getContractFactory("UniswapV3ETHSwapper");
  const swapper = await SwapFactory.deploy();

  await swapper.waitForDeployment();

  const swapperAddress = await swapper.getAddress();

  console.log("Swap contract:", swapperAddress);

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

  console.log("X balance:", ethers.formatEther(wethBalance));

  if (wethBalance === 0n) {
    throw new Error("No WETH received after wrapping");
  }

  // =====================================================
  // STEP 3: Approve WETH to your contract
  // =====================================================

  console.log("Approving WETH to swap contract...");

  const approveTx = await link.approve(
    swapperAddress,
    wethBalance
  );

  await approveTx.wait();

  console.log("WETH approved");

  

   const quoter = await ethers.getContractAt(
    "IQuoter",
    "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"
  );


  // console.log(wethBalance);
  
  const amountOut = await quoter.quoteExactInputSingle.staticCall(
     LINK,
    WETH,
    fee,
    wethBalance,
    0
  );

  console.log("Expected WETH output:", ethers.formatEther(amountOut));

  // =====================================================
  // STEP 4: Swap WETH -> LINK
  // =====================================================

  console.log("Swapping X -> WETH...");

  const swapTx = await swapper.swapTokenForToken(
    LINK,     
    WETH,         // tokenIn
        // tokenOut
    fee,          // pool fee
    wethBalance,  // amountIn
    0             // amountOutMinimum (unsafe for production)
  );

  await swapTx.wait();

  console.log("Swap executed successfully");

  // =====================================================
  // STEP 5: Final LINK Balance
  // =====================================================

  const linkBalance = await weth.balanceOf(deployer.address);

  console.log("Final WETH balance:", formatEther(linkBalance));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});