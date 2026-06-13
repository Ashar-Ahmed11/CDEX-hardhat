const { ethers, network } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deployer:", deployer.address);

    const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

    const WHALE = "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643";

    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [WHALE],
    });

    await network.provider.send("hardhat_setBalance", [
        WHALE,
        "0x3635C9ADC5DEA00000"
    ]);

    const whaleSigner = await ethers.getSigner(WHALE);

    console.log("Whale ready:", WHALE);

    const abi = [
        "function transfer(address to, uint256 amount) returns (bool)",
        "function balanceOf(address) view returns (uint256)"
    ];

    const dai = new ethers.Contract(DAI, abi, whaleSigner);
    const usdc = new ethers.Contract(USDC, abi, whaleSigner);

    // --- GET REAL BALANCES ---
    const daiBal = await dai.balanceOf(WHALE);
    const usdcBal = await usdc.balanceOf(WHALE);

    console.log("DAI balance:", daiBal.toString());
    console.log("USDC balance:", usdcBal.toString());

    // --- TRANSFER ALL DAI ---
    if (daiBal > 0n) {
        console.log("Sending ALL DAI...");
        const tx1 = await dai.transfer(deployer.address, daiBal);
        await tx1.wait();
    } else {
        console.log("No DAI to transfer");
    }

    // --- TRANSFER ALL USDC ---
    if (usdcBal > 0n) {
        console.log("Sending ALL USDC...");
        const tx2 = await usdc.transfer(deployer.address, usdcBal);
        await tx2.wait();
    } else {
        console.log("No USDC to transfer");
    }

    console.log("DONE ✅ All available tokens transferred");

    await network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [WHALE],
    });


    console.log("FINAL CHECK");

console.log(
  "Deployer DAI:",
  (await dai.balanceOf(deployer.address)).toString()
);
console.log(deployer.address);
console.log();

console.log(
  "Deployer USDC:",
  (await usdc.balanceOf(deployer.address)).toString()
);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});