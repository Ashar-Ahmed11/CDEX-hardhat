const {
  AlphaRouter,
  SwapType,
} = require("@uniswap/smart-order-router");
const { Token, CurrencyAmount, TradeType, Percent } = require("@uniswap/sdk-core");
const { ethers } = require("hardhat");
const { JsonRpcProvider } = require("@ethersproject/providers");
const { parseUnits } = require("@ethersproject/units");

async function main() {
  const chainId = 1;

  // ethers v5 provider for AlphaRouter
  const provider = new JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/3bP_dCBvn8Y50_cGNX8k26ygTP-P_QSx", chainId);

  const USDT = new Token(
    chainId,
    "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    6,
    "USDT",
    "Tether USD"
  );

  const WBTC = new Token(
    chainId,
    "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    18,
    "WBTC",
    "Wrapped BTC"
  );

  const alphaRouter = new AlphaRouter({
    chainId,
    provider,
  });

  const amountIn = parseUnits("100", 6);

  const recipient = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  const route = await alphaRouter.route(
    CurrencyAmount.fromRawAmount(USDT, amountIn.toString()),
    WBTC,
    TradeType.EXACT_INPUT,
    {
      recipient,
      slippageTolerance: new Percent(50, 10_000), // 0.5%
      deadline: Math.floor(Date.now() / 1000) + 1200, // 20 mins
      type: SwapType.SWAP_ROUTER_02,
    }
  );

  if (!route) throw new Error("No route found");

  console.log("Expected output:", route.quote.toFixed());
  console.log("Gas adjusted quote:", route.quoteGasAdjusted.toFixed());
  console.log("Router address:", route.methodParameters.to);
  console.log("Value:", route.methodParameters.value);
  console.log("Calldata:", route.methodParameters.calldata);
  
  console.log("router", route.route[0].route.pools);
  
}

main().catch(console.error);