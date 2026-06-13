const { ethers } = require("hardhat");

const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const LINK = "0x514910771AF9Ca656af840dff83E8264EcF986CA";

const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)"
];

const tenEther = ethers.parseEther("10");
const fiveEther = ethers.parseEther("5");

async function logTradeToken(pool, tradeTokenId) {
  const tradeToken = await pool.tradeTokenById(tradeTokenId);

  console.log(`\ntradeTokenById(${tradeTokenId})`);
  console.log("tokenAddress:", tradeToken.tokenAddress);
  console.log("tokenTotalBalance:", ethers.formatEther(tradeToken.tokenTotalBalance));
  console.log("tokenEntryPrice:", tradeToken.tokenEntryPrice.toString());
  console.log("tokenExitPrice:", tradeToken.tokenExitPrice.toString());
  console.log("tradeStatus:", tradeToken.tradeStatus.toString());
}

async function logUserPoolData(pool, user, label) {
  const poolTokenAmount = await pool.poolTokenAmount();
  const memberTokenBalance = await pool.memberTokenBalance(user.address);
  const tradeTokenBalance = await pool.tradeTokenBalance(user.address, 1);

  console.log(`\n${label}`);
  console.log("address:", user.address);
  console.log("poolTokenAmount:", ethers.formatEther(poolTokenAmount));
  console.log("memberTokenBalance:", ethers.formatEther(memberTokenBalance));
  console.log("tradeTokenBalance:", ethers.formatEther(tradeTokenBalance));
}

async function logAllData(pool, address1, address2, title) {
  console.log(`\n================ ${title} ================`);

  await logTradeToken(pool, 1);

  await logUserPoolData(pool, address1, "Address 1 Data");
  await logUserPoolData(pool, address2, "Address 2 Data");
}

async function main() {
  const [address1, address2] = await ethers.getSigners();

  console.log("Address 1:", address1.address);
  console.log("Address 2:", address2.address);

  const weth = new ethers.Contract(WETH, ERC20_ABI, ethers.provider);

  // 1. Deploy UniswapV3ETHSwapper contract
  const UniswapV3ETHSwapper = await ethers.getContractFactory("UniswapV3ETHSwapper");
  const swapper = await UniswapV3ETHSwapper.deploy();
  await swapper.waitForDeployment();

  const swapperAddress = await swapper.getAddress();
  console.log("\nUniswapV3ETHSwapper deployed at:", swapperAddress);

  // 2. Address 1 wraps 10 ETH
  const wrapTx1 = await swapper.connect(address1).wrapETH({
    value: tenEther
  });
  await wrapTx1.wait();

  console.log(
    "Address 1 WETH balance:",
    ethers.formatEther(await weth.balanceOf(address1.address))
  );

  // 3. Address 2 wraps 10 ETH
  const wrapTx2 = await swapper.connect(address2).wrapETH({
    value: tenEther
  });
  await wrapTx2.wait();

  console.log(
    "Address 2 WETH balance:",
    ethers.formatEther(await weth.balanceOf(address2.address))
  );

  // 4. Deploy PoolManager contract
  const PoolManager = await ethers.getContractFactory("PoolManager");
  // const poolManager = await ethers.getContractAt("PoolManager", "0x0A3EE490d067C266Ceb6f17aA43bBE7732Ed11c9");
  const poolManager = await PoolManager.deploy();
  await poolManager.waitForDeployment();

  const poolManagerAddress = await poolManager.getAddress();
  console.log("\nPoolManager deployed at:", poolManagerAddress);

  // 5. Address 1 approves 10 WETH to PoolManager
  const approveTx1 = await weth.connect(address1).approve(poolManagerAddress, tenEther);
  await approveTx1.wait();

  console.log(
    "Address 1 allowance to PoolManager:",
    ethers.formatEther(await weth.allowance(address1.address, poolManagerAddress))
  );

  // 6. Address 1 creates pool with WETH and 10 ETH amount
  const createPoolTx = await poolManager.connect(address1).createPool(WETH, tenEther);
  await createPoolTx.wait();

  // 7. Call poolbyId for pool 1 and store pool address
  const poolAddress = await poolManager.poolbyId(1);
  // const poolAddress = await poolManager.poolbyId(poolManager.pools());
  console.log("\nPool address from poolbyId(1):", poolAddress);

  // 8. Create instance for respective pool address
  const pool = await ethers.getContractAt("Pool", poolAddress);

  console.log(
    "Pool WETH balance after createPool:",
    ethers.formatEther(await weth.balanceOf(poolAddress))
  );

  // 9. Address 2 approves 5 WETH to respective pool address
  const approveTx2 = await weth.connect(address2).approve(poolAddress, fiveEther);
  await approveTx2.wait();

  console.log(
    "Address 2 allowance to Pool:",
    ethers.formatEther(await weth.allowance(address2.address, poolAddress))
  );

  // 10. Address 2 calls depositToken with 5 ETH amount
  const depositTx = await pool.connect(address2).depositToken(fiveEther);
  await depositTx.wait();

  console.log(
    "Pool WETH balance after Address 2 deposit:",
    ethers.formatEther(await weth.balanceOf(poolAddress))
  );

  // 11. Address 1 calls trade with LINK and 5 ETH amount
  const tradeTx = await pool.connect(address1).trade(LINK, fiveEther);
  await tradeTx.wait();

  // 12, 13, 14. Console log tradeTokenById and user data
  await logAllData(pool, address1, address2, "AFTER TRADE");

  // 15. Address 1 calls dca with tradeTokenId 1 and 10 ETH amount
  // const dcaTx = await pool.connect(address1).dca(1, tenEther);
  // await dcaTx.wait();

  // // 16. Console log same data again
  // await logAllData(pool, address1, address2, "AFTER DCA");

  // 17. Address 1 calls sellToken with tradeTokenId 1
  // const sellTx = await pool.connect(address1).sellToken(1);
  // await sellTx.wait();

  // // 18. Console log same data again
  // await logAllData(pool, address1, address2, "AFTER SELL TOKEN");
}

main()
  .then(() => {
    console.log("\nScript completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nScript failed:");
    console.error(error);
    process.exit(1);
  });