const hre = require("hardhat");

async function main() {
  const [deployer, buyer, inspector, lender, government] = await hre.ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Buyer:", buyer.address);
  console.log("Inspector:", inspector.address);
  console.log("Lender:", lender.address);
  console.log("Government:", government.address);

  const RealEstate = await hre.ethers.getContractFactory("RealEstate");
  const realEstate = await RealEstate.deploy();
  await realEstate.waitForDeployment();
  console.log(`RealEstate deployed to: ${realEstate.target}`);

  const Escrow = await hre.ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(
    realEstate.target,
    inspector.address,
    lender.address,
    government.address
  );
  await escrow.waitForDeployment();
  console.log(`Escrow deployed to: ${escrow.target}`);

  console.log("✅ Deployer automatically has inspector + lender + government roles.");
  console.log("✅ Passed inspector/lender/government addresses also got their roles.");
  console.log("✅ Contracts deployed successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});