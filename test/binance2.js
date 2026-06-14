// scripts/test-create2-flow.js

const { parseEther, parseUnits } = require("ethers");
const { ethers } = require("hardhat");

async function main() {
    const [signer] = await ethers.getSigners();

    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const DAI_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const RNDR_ADDRESS = "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9";

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

const [bestFee] =
  await swapper.getBestFeeTier.staticCall(
    WETH_ADDRESS,
    DAI_ADDRESS,
    parseEther("10")
  );

console.log("Best Fee:", bestFee);
// console.log("Best Amount Out:", bestAmountOut.toString());

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
        bestFee,
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
        "ERC20",
        DAI_ADDRESS
    );
     const rndr = await ethers.getContractAt(
        "ERC20",
        RNDR_ADDRESS
    );

    const daiBalance = await dai.balanceOf(
        computedAddress
    );
    const tokenSymbol = await dai.symbol();
    console.log("Token Symbol:", tokenSymbol);
    const daidecimalsRaw = await dai.decimals();
    const daidecimals = Number(daidecimalsRaw);
    // console.log(
    //     "DAI Decimals:",
    //     daidecimals
    // );
    

    
    console.log(
        "DAI Balance:",
        ethers.formatUnits(daiBalance, daidecimals)
    );



    const [swapFee] =
    await swapper.getBestFeeTier.staticCall(
        DAI_ADDRESS,
        RNDR_ADDRESS,
    parseUnits("10", daidecimals),
 
  );
  

console.log("Best Fee:", swapFee);

const [gasSponserFee] =
  await swapper.getBestFeeTier.staticCall(
      WETH_ADDRESS,
      DAI_ADDRESS,
    parseEther("10")
  );

console.log("Best Fee:", gasSponserFee);



   const estimatedGas =
    await create2Contract.getFunction("swap").estimateGas(
        DAI_ADDRESS,
        RNDR_ADDRESS,
        
        daiBalance,
        swapFee,
          ethers.parseEther("1"),
        gasSponserFee
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
            daidecimals
        )
    );

    // =====================================================
    // 11. Execute swap()
    // =====================================================

    const executeTx = await create2Contract.swap(
        DAI_ADDRESS,
        RNDR_ADDRESS,
        // 500, 

        daiBalance,
                swapFee,
        sponsoredGasAmount,
        gasSponserFee
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

    const rndrBalanceAfter =
        await rndr.balanceOf(computedAddress);
    
    const rndrDecimalsRaw = await rndr.decimals();
    const rndrDecimals = Number(rndrDecimalsRaw);

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
            daidecimals
        )
    );
    console.log(
        "Contract RNDR:",
        ethers.formatUnits(
            rndrBalanceAfter,
            rndrDecimals
        )
    );


    // =====================================================
// 13. Execute reverse swap RNDR -> DAI
// =====================================================

console.log("\n\n========== REVERSE SWAP: RNDR -> DAI ==========");

const rndrBalanceBeforeReverse = await rndr.balanceOf(computedAddress);
const daiBalanceBeforeReverse = await dai.balanceOf(computedAddress);
const wethBalanceBeforeReverse = await weth.balanceOf(computedAddress);

console.log("\n========== BEFORE REVERSE ==========");
console.log(
    "Contract RNDR:",
    ethers.formatUnits(rndrBalanceBeforeReverse, rndrDecimals)
);
console.log(
    "Contract DAI:",
    ethers.formatUnits(daiBalanceBeforeReverse, daidecimals)
);
console.log(
    "Contract WETH:",
    ethers.formatEther(wethBalanceBeforeReverse)
);

// Best fee for RNDR -> DAI
const [reverseSwapFee] =
    await swapper.getBestFeeTier.staticCall(
        RNDR_ADDRESS,
        DAI_ADDRESS,
        rndrBalanceBeforeReverse,
          {
            gasLimit: 16_000_000
        }
    );

console.log("Reverse Swap Fee RNDR -> DAI:", reverseSwapFee);

// Fee tier for gas sponsor swap WETH -> RNDR
const [reverseGasSponsorFee] =
    await swapper.getBestFeeTier.staticCall(
        WETH_ADDRESS,
        RNDR_ADDRESS,
        ethers.parseEther("10")
    );

console.log("Reverse Gas Sponsor Fee WETH -> RNDR:", reverseGasSponsorFee);

// Estimate gas for RNDR -> DAI
const reverseEstimatedGas =
    await create2Contract.getFunction("swap").estimateGas(
        RNDR_ADDRESS,
        DAI_ADDRESS,
        rndrBalanceBeforeReverse,
        reverseSwapFee,
        ethers.parseEther("1"),
        reverseGasSponsorFee
    );

console.log("Reverse Estimated Gas:", reverseEstimatedGas.toString());

const reverseSponsoredGasAmount = reverseEstimatedGas;

// Execute reverse swap
const reverseTx = await create2Contract.swap(
    RNDR_ADDRESS,
    DAI_ADDRESS,
    rndrBalanceBeforeReverse,
    reverseSwapFee,
    reverseSponsoredGasAmount,
    reverseGasSponsorFee
);

await reverseTx.wait();

console.log("\nReverse swap RNDR -> DAI executed");

// =====================================================
// 14. Balances AFTER reverse swap
// =====================================================

const rndrBalanceAfterReverse = await rndr.balanceOf(computedAddress);
const daiBalanceAfterReverse = await dai.balanceOf(computedAddress);
const wethBalanceAfterReverse = await weth.balanceOf(computedAddress);
const signerEthAfterReverse = await ethers.provider.getBalance(signer.address);

console.log("\n========== AFTER REVERSE ==========");
console.log(
    "Signer ETH:",
    ethers.formatEther(signerEthAfterReverse)
);
console.log(
    "Contract WETH:",
    ethers.formatEther(wethBalanceAfterReverse)
);
console.log(
    "Contract DAI:",
    ethers.formatUnits(daiBalanceAfterReverse, daidecimals)
);
console.log(
    "Contract RNDR:",
    ethers.formatUnits(rndrBalanceAfterReverse, rndrDecimals)
);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});