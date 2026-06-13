const { ethers } = require("hardhat");

async function main() {
  const [owner] = await ethers.getSigners();

  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const LINK = "0x514910771AF9Ca656af840dff83E8264EcF986CA";

  const TEN_ETH = ethers.parseEther("10");
  const TWO_ETH = ethers.parseEther("2");
  const ONE_ETH = ethers.parseEther("1");

  console.log("Owner:", owner.address);

  // 1. Deploy UniswapV3ETHSwapper
  const Swapper = await ethers.getContractFactory("UniswapV3ETHSwapper");
  const swapper = await Swapper.deploy();
  await swapper.waitForDeployment();

  console.log("Swapper deployed:", await swapper.getAddress());

  // 2. Wrap 10 ETH
  const wrapTx = await swapper.wrapETH({
    value: TEN_ETH,
  });
  await wrapTx.wait();

  console.log("Wrapped 10 ETH into WETH");

  // 3. Deploy PoolManager
  const PoolManager = await ethers.getContractFactory("PoolManager");
  const poolManager = await PoolManager.deploy();
  await poolManager.waitForDeployment();

  console.log("PoolManager deployed:", await poolManager.getAddress());

  // WETH instance
  const weth =  await ethers.getContractAt(
    "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
    WETH
  );

  const wethBalance = await weth.balanceOf(owner.address);
  console.log("Owner WETH Balance:", ethers.formatEther(wethBalance));

  // 4. Approve 10 WETH to PoolManager
  const approveTx = await weth.approve(await poolManager.getAddress(), TEN_ETH);
  await approveTx.wait();

  console.log("Approved 10 WETH to PoolManager");

  // 5. Create pool
  const createPoolTx = await poolManager.createPool(WETH, TEN_ETH);
  await createPoolTx.wait();

  console.log("Pool created");

  // 6. Get pool address
  const poolAddress = await poolManager.poolbyId(1);
  console.log("Pool Address:", poolAddress);

  // 7. Create Pool instance
  const pool = await ethers.getContractAt("Pool", poolAddress);

  // 8. Call trade with LINK and 2 ETH
  const tradeTx = await pool.trade(LINK, TWO_ETH);
  await tradeTx.wait();

  console.log("Trade completed");

  // 9. Console tradeTokenById(1)
  let tradeTokenById = await pool.tradeTokenById(1);
  console.log("tradeTokenById(1) after trade:", tradeTokenById);

  // 10. Console pool/member/trade balances
  let poolTokenAmount = await pool.poolTokenAmount();
  let memberTokenBalance = await pool.memberTokenBalance(owner.address);
  let tradeTokenBalance = await pool.tradeTokenBalance(owner.address, 1);

  console.log("poolTokenAmount after trade:", ethers.formatEther(poolTokenAmount));
  console.log("memberTokenBalance after trade:", ethers.formatEther(memberTokenBalance));
  console.log("tradeTokenBalance after trade:", ethers.formatEther(tradeTokenBalance));

  // 11. Call DCA
  const dcaTx = await pool.dca(1, ONE_ETH);
  await dcaTx.wait();

  console.log("DCA completed");

  // 12. Console again
  tradeTokenById = await pool.tradeTokenById(1);
  console.log("tradeTokenById(1) after DCA:", tradeTokenById);

  poolTokenAmount = await pool.poolTokenAmount();
  memberTokenBalance = await pool.memberTokenBalance(owner.address);
  tradeTokenBalance = await pool.tradeTokenBalance(owner.address, 1);

  console.log("poolTokenAmount after DCA:", ethers.formatEther(poolTokenAmount));
  console.log("memberTokenBalance after DCA:", ethers.formatEther(memberTokenBalance));
  console.log("tradeTokenBalance after DCA:", ethers.formatEther(tradeTokenBalance));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });