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
        let tx = await realEstate
            .connect(seller)
            .mint('ipfs://QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS');
        await tx.wait();

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

        // Approve the Escrow contract to transfer the Real Estate token
        tx = await realEstate.connect(seller).approve(escrow.address, 1);
        await tx.wait();

        // List the Real Estate token for sale
        tx = await escrow.connect(seller).list(1, tokens(100), tokens(0.1), buyer.address);
        await tx.wait();
    })

    describe('Deployment', () => {
        it('Should set the correct state variables', async () => {
            expect(await escrow.nftAddress()).to.be.equal(realEstate.address);
            expect(await escrow.seller()).to.be.equal(seller.address);
            expect(await escrow.inspector()).to.be.equal(inspector.address);
            expect(await escrow.lender()).to.be.equal(lender.address);
        })
    })

    describe('Listing', () => {
        it('Lists the Real Estate token for sale', async () => {
            expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address);
            const listing = await escrow.listing(1);
            expect(listing.seller).to.be.equal(seller.address);
            expect(listing.purchasePrice).to.be.equal(tokens(100));
            expect(listing.escrowAmount).to.be.equal(tokens(0.1));
            expect(listing.buyer).to.be.equal(buyer.address);
        })
    })

    describe('Deposits', () => {
        it('Updates contract balance', async () => {
            const tx = await escrow.connect(buyer).depositEarnest(1, { value: tokens(0.1) });
            await tx.wait();
            expect(await ethers.provider.getBalance(escrow.address)).to.be.equal(tokens(0.1));
        })
    })

    describe('Purchases', () => {
        it('Updates the inspection status', async () => {
            const tx = await escrow.connect(inspector).updateInspectionStatus(1, true);
            await tx.wait();
            const listing = await escrow.listing(1);
            expect(listing.inspectionPassed).to.be.true;
        })
    })

    describe('Approvals', () => {
        it('Approves the Sale by buyer, seller, and lender', async () => {
            let tx = await escrow.connect(buyer).approveSale(1);
            await tx.wait();

            tx = await escrow.connect(seller).approveSale(1);
            await tx.wait();

            tx = await escrow.connect(lender).approveSale(1);
            await tx.wait();

            expect(await escrow.approvals(1, buyer.address)).to.be.true;
            expect(await escrow.approvals(1, seller.address)).to.be.true;
            expect(await escrow.approvals(1, lender.address)).to.be.true;
        })
    })
});
