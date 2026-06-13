// scripts/test-create2-flow.js

const { ethers } = require("hardhat");

async function main() {
    const [signer] = await ethers.getSigners();

    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

    const TEN_ETH = ethers.parseEther("10");

    console.log("Signer:", signer.address);

    // =====================================================
    // 1. Deploy Create2Factory
    // =====================================================

    const Factory = await ethers.getContractFactory("Create2Factory");
    const create2Factory = await Factory.deploy();
    await create2Factory.waitForDeployment();

    const factoryAddress = await create2Factory.getAddress();

    console.log("Create2Factory:", factoryAddress);

    // =====================================================
    // 2. Compute CREATE2 Address using salt = 1
    // =====================================================

    const computedAddress = await create2Factory.getWalletAddress(1);

    console.log("Computed Address:", computedAddress);

    // =====================================================
    // 3. Deploy UniswapV3ETHSwapper
    // =====================================================

    const Swapper = await ethers.getContractFactory("UniswapV3ETHSwapper");

    const swapper = await Swapper.deploy();

    await swapper.waitForDeployment();

    const swapperAddress = await swapper.getAddress();

    console.log("Swapper:", swapperAddress);

    // =====================================================
    // 4. Wrap 10 ETH
    // =====================================================

    const wrapTx = await swapper.wrapETH({
        value: TEN_ETH,
    });

    await wrapTx.wait();

    console.log("Wrapped 10 ETH");

    // =====================================================
    // 5. Transfer 10 WETH to swapper contract
    // =====================================================

    const weth = await ethers.getContractAt(
        "IERC20",
        WETH_ADDRESS
    );

    const transferTx = await weth.transfer(
        swapperAddress,
        TEN_ETH
    );

    await transferTx.wait();

    console.log("Transferred 10 WETH to swapper");

    // =====================================================
    // 6. Swap WETH -> DAI
    // recipient = computedAddress
    // =====================================================

    const swapTx = await swapper.swapTokenForToken(
        WETH_ADDRESS,
        DAI_ADDRESS,
        3000,
        TEN_ETH,
        computedAddress
    );

    await swapTx.wait();

    console.log("Swapped WETH -> DAI");
    console.log("Recipient:", computedAddress);

    // =====================================================
    // 7. Deploy CREATE2 Contract
    // =====================================================

    const deployTx = await create2Factory.deploy(1);

    await deployTx.wait();

    console.log("CREATE2 Contract Deployed");

    // =====================================================
    // 8. Create instance at computedAddress
    // =====================================================

    const create2Contract = await ethers.getContractAt(
        "DeployWithCreate2",
        computedAddress
    );

    const theAddress = await create2Contract.getAddress();

    console.log(theAddress);
    

    // =====================================================
    // 9. Estimate gas for swap()
    // =====================================================

    const dai = await ethers.getContractAt(
        "IERC20",
        DAI_ADDRESS
    );

    const daiBalance = await dai.balanceOf(
        computedAddress
    );

    console.log(
        "DAI Balance:",
        ethers.formatUnits(daiBalance, 18)
    );

   const estimatedGas =
    await create2Contract.getFunction("swap").estimateGas(
        DAI_ADDRESS,
        WETH_ADDRESS,
        daiBalance,
        ethers.parseEther("1")
    );

    const gasPrice = await ethers.provider.getFeeData();

    const sponsoredGasAmount =
        estimatedGas;

    console.log(
        "Estimated Gas:",
        estimatedGas
    );

    // console.log(
    //     "Sponsored Gas Amount:",
    //     sponsoredGasAmount.toString()
    // );

    // =====================================================
    // 10. Balances BEFORE
    // =====================================================

    const signerEthBefore =
        await ethers.provider.getBalance(
            signer.address
        );

    const wethBalanceBefore =
        await weth.balanceOf(computedAddress);

    const daiBalanceBefore =
        await dai.balanceOf(computedAddress);

    console.log("\n========== BEFORE ==========");
    console.log(
        "Signer ETH:",
        ethers.formatEther(signerEthBefore)
    );

    console.log(
        "Contract WETH:",
        ethers.formatEther(wethBalanceBefore)
    );

    console.log(
        "Contract DAI:",
        ethers.formatUnits(
            daiBalanceBefore,
            18
        )
    );

    // =====================================================
    // 11. Execute swap()
    // =====================================================

    const executeTx = await create2Contract.swap(
        DAI_ADDRESS,
        WETH_ADDRESS,
        daiBalance,
        sponsoredGasAmount
    );

    await executeTx.wait();

    console.log("\nswap() executed");

    // =====================================================
    // 12. Balances AFTER
    // =====================================================

    const signerEthAfter =
        await ethers.provider.getBalance(
            signer.address
        );

    const wethBalanceAfter =
        await weth.balanceOf(computedAddress);

    const daiBalanceAfter =
        await dai.balanceOf(computedAddress);

    console.log("\n========== AFTER ==========");
    console.log(
        "Signer ETH:",
        ethers.formatEther(signerEthAfter)
    );

    console.log(
        "Contract WETH:",
        ethers.formatEther(wethBalanceAfter)
    );

    console.log(
        "Contract DAI:",
        ethers.formatUnits(
            daiBalanceAfter,
            18
        )
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});