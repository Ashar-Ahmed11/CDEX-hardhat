require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      forking: {
        url: "https://eth-mainnet.g.alchemy.com/v2/3bP_dCBvn8Y50_cGNX8k26ygTP-P_QSx"
      },
      initialBaseFeePerGas: 0
    }
  }
};