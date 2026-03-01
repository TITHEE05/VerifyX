const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying VerifyX contract...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const VerifyX = await ethers.getContractFactory("VerifyX");
  const verifyX = await VerifyX.deploy();
  await verifyX.waitForDeployment();

  console.log("✅ VerifyX deployed to:", await verifyX.getAddress());
  console.log("Save this address! You will need it later.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
