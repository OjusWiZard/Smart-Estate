const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Escrow', () => {
    let buyer, seller, inspector, lender;
    let realEstate, escrow;

    beforeEach(async () => {
        // Setup accounts
        [buyer, seller, inspector, lender] = await ethers.getSigners();

        // Compile and deploy the Real Estate contract
        const RealEstate = await ethers.getContractFactory('RealEstate');
        realEstate = await RealEstate.deploy();
        await realEstate.deployed();
        expect(realEstate.address).to.properAddress;

        // mint the first Real Estate token
        const mintTx = await realEstate
            .connect(seller)
            .mint('ipfs://QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS');
        await mintTx.wait();

        // Compile and deploy the Escrow contract
        const Escrow = await ethers.getContractFactory('Escrow');
        escrow = await Escrow.deploy(
            realEstate.address,
            seller.address,
            inspector.address,
            lender.address
        );
        await escrow.deployed();
        expect(escrow.address).to.properAddress;
        expect(await escrow.nftAddress()).to.be.equal(realEstate.address);
    })

    describe('Deployment', () => {
        it('Should set the correct state variables', async () => {
            expect(await escrow.nftAddress()).to.be.equal(realEstate.address);
            expect(await escrow.seller()).to.be.equal(seller.address);
            expect(await escrow.inspector()).to.be.equal(inspector.address);
            expect(await escrow.lender()).to.be.equal(lender.address);
        })
    })
});
