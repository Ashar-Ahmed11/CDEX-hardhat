const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying with account:", deployer.address);
    // console.log(deployer);
    
    

    /*
        Deploy Contract
    */
    const UniswapV3ETHSwapper = await hre.ethers.getContractFactory(
        "UniswapV3ETHSwapper"
    );

        const swapper = await UniswapV3ETHSwapper.deploy();

        await swapper.waitForDeployment();

        const contractAddress = await swapper.getAddress();

    console.log("UniswapV3ETHSwapper deployed to:", contractAddress);

    /*
        Step 1: Wrap 10 ETH -> WETH
    */
        let wethBalanceBefore = await swapper.wethBalance();
        // console.log();
        
        console.log(
            "WETH Balance before wrapping:",
            hre.ethers.formatEther(wethBalanceBefore),
            "WETH"
        );


    console.log("\nWrapping 10 ETH into WETH...");

    const wrapTx = await swapper.wrapETH({
        value: hre.ethers.parseEther("10")
    });

    await wrapTx.wait();

    console.log("10 ETH wrapped successfully.");

    /*
        Step 2: Check WETH Balance
    */
    let wethBalance = await swapper.wethBalance();

    console.log(
        "WETH Balance after wrapping:",
        hre.ethers.formatEther(wethBalance),
        "WETH"
    );

    /*
        Step 3: Approve Contract to spend WETH
        Since swapTokenForToken uses transferFrom(msg.sender,...)
        you must approve first
    */
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    const weth = await hre.ethers.getContractAt(
        "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
        WETH_ADDRESS
    );

    console.log("\nApproving contract to spend 10 WETH...");

    const approveTx = await weth.approve(
        contractAddress,
        hre.ethers.parseEther("10")
    );

    await approveTx.wait();

    console.log("Approval successful.");


    const factory = new hre.ethers.Contract(
        "0x1F98431c8aD98523631AE4a59f267346ea31F984",
        [
          "function getPool(address,address,uint24) external view returns (address)"
        ],
        deployer
      );
      
      const pool = await factory.getPool(
        WETH_ADDRESS,
            "0x514910771AF9Ca656af840dff83E8264EcF986CA",
        500
      );
      
      console.log("Pool address:", pool);


      const poolAbi = [
        "function liquidity() view returns (uint128)",
        "function token0() view returns (address)",
        "function token1() view returns (address)",
        "function fee() view returns (uint24)"
      ];
      
      const poolContract = new hre.ethers.Contract(pool, poolAbi, deployer);


      const liquidity = await poolContract.liquidity();

console.log("Pool Liquidity:", liquidity.toString());



const bal = await weth.balanceOf(await swapper.getAddress());
console.log("Contract WETH balance:", bal.toString());
    /*
        Step 4: Swap WETH -> Token
    */
    const TOKEN_OUT =
        "0x6B175474E89094C44Da98b954EedeAC495271d0F";

    console.log("\nSwapping WETH -> Token...");

    const swapTx = await swapper.swapTokenForToken(
        WETH_ADDRESS,                    // tokenIn
        TOKEN_OUT,                       // tokenOut
        3000,                            // fee
        hre.ethers.parseEther("5"),     // amountIn
        0                                // amountOutMinimum
    );

    await swapTx.wait();

    console.log("Swap completed successfully.");

    /*
        Step 5: Check WETH Balance Again
    */
    wethBalance = await swapper.wethBalance();

    console.log(
        "Final WETH Balance:",
        hre.ethers.formatEther(wethBalance),
        "WETH"
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});