import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

import close from '../assets/close.svg';

const Home = ({ home, provider, account, escrow, togglePop }) => {

  const [listing, setListing] = useState(null);
  const [owner, setOwner] = useState(null);
  const [seller, setSeller] = useState(null);
  const [inspector, setInspector] = useState(null);
  const [lender, setLender] = useState(null);

  const [hasBought, setHasBought] = useState(false);
  const [hasSold, setHasSold] = useState(false);
  const [hasInspected, setHasInspected] = useState(false);
  const [hasLended, setHasLended] = useState(false);

  const fetchDetails = async () => {
    const listing = await escrow.listing(home.id);
    const seller = await escrow.seller();
    const inspector = await escrow.inspector();
    const lender = await escrow.lender();
    setListing(listing);
    setSeller(seller);
    setInspector(inspector);
    setLender(lender);

    const hasBought = listing.sold;
    const hasSold = listing.sold;
    const hasInspected = listing.inspectionPassed;
    const hasLended = await escrow.approvals(home.id, lender);
    const owner = hasSold ? listing.buyer : seller;
    setHasBought(hasBought);
    setHasSold(hasSold);
    setHasInspected(hasInspected);
    setHasLended(hasLended);

    console.log('listing', listing);
    console.log('seller', seller);
    console.log('inspector', inspector);
    console.log('lender', lender);
    console.log('hasBought', hasBought);
    console.log('hasSold', hasSold);
    console.log('hasInspected', hasInspected);
    console.log('hasLended', hasLended);
    console.log('owner', owner);
  }

  const fetchOwner = async () => {
    if (await escrow.listing(home.id)) return
    const owner = await escrow.buyer(home.id);
    setOwner(owner);
  }

  useEffect(() => {
    fetchDetails();
    fetchOwner();
  }, [hasSold]);

  const buyHandler = async () => {
    const escrowAmount = listing.escrowAmount;
    const signer = await provider.getSigner();
    let tx = await escrow.connect(signer).depositEarnest(home.id, { value: escrowAmount });
    await tx.wait();
    tx = await escrow.connect(signer).approveSale(home.id);
    await tx.wait();
    setHasBought(true);
  }

  const sellHandler = async () => {
    const signer = await provider.getSigner();
    let tx = await escrow.connect(signer).approveSale(home.id);
    await tx.wait();
    tx = await escrow.connect(signer).finalizeSale(home.id);
    await tx.wait();
    setHasSold(true);
  }

  const inspectHandler = async () => {
    const signer = await provider.getSigner();
    let tx = await escrow.connect(signer).updateInspectionStatus(home.id, true);
    await tx.wait();
    setHasInspected(true);
  }

  const lendHandler = async () => {
    const signer = await provider.getSigner();
    let tx = await escrow.connect(signer).approveSale(home.id);
    await tx.wait();
    const lendAmount = listing.purchasePrice - listing.escrowAmount;
    tx = await signer.sendTransaction({ to: escrow.address, value: lendAmount.toString(), gasLimit: 60000 })
    await tx.wait();
    setHasLended(true);
  }

  return (
    <div className='home'>
      <div className='home__details'>
        <div className='home__image'>
          <img src={home.image} alt='Home' />
        </div>
        <div className='home__overview'>
          <h1>{home.name}</h1>
          <p>
            <strong>{home.attributes[2].value}</strong> bds |
            <strong>{home.attributes[3].value}</strong> ba |
            <strong>{home.attributes[4].value}</strong> sqft
          </p>
          <p>{home.address}</p>
          <h2>{home.attributes[0].value} ETH</h2>
          {
            owner ? (
              <div className='home__owned'>
                Owned by {owner.slice(0, 6)}...{owner.slice(-4)}
              </div>
            ) : (
              <div>
                {account === inspector ? (
                  <button className='home__buy' onClick={() => inspectHandler()} disabled={hasInspected}>
                    Approve Inspection
                  </button>
                ) : (account === lender) ? (
                  <button className='home__buy' onClick={() => lendHandler()} disabled={hasLended}>
                    Approve and Lend
                  </button>
                ) : (account == seller) ? (
                  <button className='home__buy' onClick={() => sellHandler()} disabled={hasSold}>
                    Approve and Sell
                  </button>
                ) : (
                  <button className='home__buy' onClick={() => buyHandler()} disabled={hasSold}>
                    Buy
                  </button>
                )}
                <button className='home__contact'>
                  Contact Agent
                </button>
              </div>
            )
          }
          <hr />
          <h2>Overview</h2>
          <p>{home.description}</p>
          <hr />
          <h2>Facts & Features</h2>
          <ul>
            {home.attributes.map((attribute, index) => (
              <li key={index}>
                <strong>{attribute.trait_type}</strong>: {attribute.value}
              </li>
            ))}
          </ul>
        </div>
        <button onClick={togglePop} className='home__close'>
          <img src={close} alt='Close' />
        </button>
      </div>
    </div >
  );
}

export default Home;
