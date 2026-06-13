const { ethers } = require("hardhat");

async function main() {
  const [address1, address2] = await ethers.getSigners();

  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const LINK = "0x514910771AF9Ca656af840dff83E8264EcF986CA";

  const TEN_ETH = ethers.parseEther("10");
  const FIVE_ETH = ethers.parseEther("5");

  console.log("Address 1:", address1.address);
  console.log("Address 2:", address2.address);

  // 1. Deploy UniswapV3ETHSwapper contract
  const Swapper = await ethers.getContractFactory("UniswapV3ETHSwapper");
  const swapper = await Swapper.deploy();
  await swapper.waitForDeployment();

  const swapperAddress = await swapper.getAddress();
  console.log("UniswapV3ETHSwapper deployed at:", swapperAddress);

  // 2. Address 1 wraps 10 ETH
  let tx = await swapper.connect(address1).wrapETH({
    value: TEN_ETH,
  });
  await tx.wait();

  console.log("Address 1 wrapped 10 ETH into WETH");

  // 3. Address 2 wraps 10 ETH
  tx = await swapper.connect(address2).wrapETH({
    value: TEN_ETH,
  });
  await tx.wait();

  console.log("Address 2 wrapped 10 ETH into WETH");

  // WETH contract instance
  const weth = await ethers.getContractAt(
    "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
    WETH
  );

  console.log(
    "Address 1 WETH balance:",
    ethers.formatEther(await weth.balanceOf(address1.address))
  );

  console.log(
    "Address 2 WETH balance:",
    ethers.formatEther(await weth.balanceOf(address2.address))
  );

  // 4. Deploy PoolManager contract
  const PoolManager = await ethers.getContractFactory("PoolManager");
  const poolManager = await PoolManager.deploy();
  await poolManager.waitForDeployment();

  const poolManagerAddress = await poolManager.getAddress();
  console.log("PoolManager deployed at:", poolManagerAddress);

  // 5. Address 1 approves 10 WETH to PoolManager
  tx = await weth.connect(address1).approve(poolManagerAddress, TEN_ETH);
  await tx.wait();

  console.log("Address 1 approved 10 WETH to PoolManager");

  // 6. Address 1 creates pool with WETH and 10 ETH amount
  tx = await poolManager.connect(address1).createPool(WETH, TEN_ETH);
  await tx.wait();

  console.log("Address 1 created pool with 10 WETH");

  // 7. Get pool address from poolbyId(1)
  const poolAddress = await poolManager.poolbyId(1);
  console.log("Pool 1 address:", poolAddress);

  // 8. Create instance for deployed pool address
  const pool = await ethers.getContractAt("Pool", poolAddress);

  // 9. Address 2 approves 5 WETH to pool address
  tx = await weth.connect(address2).approve(poolAddress, FIVE_ETH);
  await tx.wait();

  console.log("Address 2 approved 5 WETH to Pool");

  // 10. Address 2 deposits 5 WETH into pool
  tx = await pool.connect(address2).depositToken(FIVE_ETH);
  await tx.wait();

  console.log("Address 2 deposited 5 WETH into Pool");

  // 11. Address 1 calls trade with LINK and 5 ETH amount
  tx = await pool.connect(address1).trade(LINK, FIVE_ETH);
  await tx.wait();

  console.log("Address 1 traded 5 WETH into LINK");

  // 12. Console tradeTokenById(1)
  let tradeTokenById = await pool.tradeTokenById(1);
  console.log("tradeTokenById(1) after trade:", tradeTokenById);

  // 13. Logs for address 1
  await logUserPoolData(pool, address1.address, "Address 1 after trade");

  // 14. Logs for address 2
  await logUserPoolData(pool, address2.address, "Address 2 after trade");

  // 15. Address 1 calls DCA with tradeTokenId 1 and 10 ETH amount
  tx = await pool.connect(address1).dca(1, TEN_ETH);
  await tx.wait();

  console.log("Address 1 called DCA with 10 WETH");

  // 16. Console tradeTokenById(1) again
  tradeTokenById = await pool.tradeTokenById(1);
  console.log("tradeTokenById(1) after DCA:", tradeTokenById);

  // 17. Logs for address 1 again
  await logUserPoolData(pool, address1.address, "Address 1 after DCA");

  // 18. Logs for address 2 again
  await logUserPoolData(pool, address2.address, "Address 2 after DCA");
}

async function logUserPoolData(pool, userAddress, label) {
  const poolTokenAmount = await pool.poolTokenAmount();
  const memberTokenBalance = await pool.memberTokenBalance(userAddress);
  const tradeTokenBalance = await pool.tradeTokenBalance(userAddress, 1);

  console.log("==========", label, "==========");
  console.log("User:", userAddress);
  console.log("poolTokenAmount:", ethers.formatEther(poolTokenAmount));
  console.log("memberTokenBalance:", ethers.formatEther(memberTokenBalance));
  console.log("tradeTokenBalance:", ethers.formatEther(tradeTokenBalance));
  console.log("=====================================");
}

main()
  .then(() => {
    console.log("Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });