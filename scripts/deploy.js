// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

async function main() {
    // Setup accounts
    [buyer, seller, inspector, lender] = await ethers.getSigners();

    // Compile and deploy the Real Estate contract
    const RealEstate = await ethers.getContractFactory('RealEstate');
    const realEstate = await RealEstate.deploy();
    await realEstate.deployed();
    console.log('Real Estate deployed to:', realEstate.address);

    console.log('Minting Real Estate token...');
    for (let i = 1; i <= 3; i++) {
        const tx = await realEstate
            .connect(seller)
            .mint(`https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/${i}.json`);
        await tx.wait();
    }

    const Escrow = await ethers.getContractFactory('Escrow');
    const escrow = await Escrow.deploy(
        realEstate.address,
        seller.address,
        inspector.address,
        lender.address
    );
    await escrow.deployed();
    console.log('Escrow deployed to:', escrow.address);

    console.log('Approving Escrow contract to transfer Real Estate token...');
    for (let i = 1; i <= 3; i++) {
        const tx = await realEstate
            .connect(seller)
            .approve(escrow.address, i);
        await tx.wait();
    }

    console.log('Listing Real Estate token for sale...');
    tx = await escrow.connect(seller).list(1, tokens(100), tokens(0.1), buyer.address);
    await tx.wait();
    tx = await escrow.connect(seller).list(2, tokens(200), tokens(0.2), buyer.address);
    await tx.wait();
    tx = await escrow.connect(seller).list(3, tokens(300), tokens(0.3), buyer.address);
    await tx.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
