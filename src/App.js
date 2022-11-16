import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

// Components
import Navigation from './components/Navigation';
import Search from './components/Search';
import Home from './components/Home';

// ABIs
import RealEstate from './abis/RealEstate.json'
import Escrow from './abis/Escrow.json'

// Config
import config from './config.json';

function App() {

  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [escrow, setEscrow] = useState(null);
  const [homes, setHomes] = useState([]);
  const [home, setHome] = useState(null);
  const [toggle, setToggle] = useState(false);

  const loadBlockchainData = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(provider);

    const network = await provider.getNetwork();

    const escrowAddress = config[network.chainId].escrow.address;
    const realEstateAddress = config[network.chainId].realEstate.address;

    const realEstate = new ethers.Contract(realEstateAddress, RealEstate, provider);
    const escrow = new ethers.Contract(escrowAddress, Escrow, provider);
    setEscrow(escrow);

    const totalSupply = await realEstate.totalSupply();
    const homes = [];
    for (let i = 1; i <= totalSupply; i++) {
      const uri = await realEstate.tokenURI(i);
      const response = await fetch(uri);
      const metadata = await response.json();
      homes.push(metadata);
    }
    setHomes(homes);

    window.ethereum.on('accountsChanged', async () => {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = ethers.utils.getAddress(accounts[0]);
      setAccount(account);
    });
  }

  useEffect(() => {
    loadBlockchainData();
  }, []);

  const handleClick = async (home) => {
    setHome(home);
    toggle ? setToggle(false) : setToggle(true);
  }

  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />
      <Search />
      <div className='cards__section'>
        <h3>Welcome to Smart Estate</h3>
        <hr />
        <div className='cards'>
          {
            homes.map((home, index) => (
              <div className='card' onClick={() => handleClick(home)} key={index}>
                <div className='card__image'>
                  <img src={home.image} alt='House' />
                </div>
                <div className='card__info'>
                  <h4>{home.attributes[0].value}</h4>
                  {
                    <p>
                      <strong>{home.attributes[2].value}</strong> {home.attributes[2].trait_type} |
                      <strong>{home.attributes[3].value}</strong> {home.attributes[3].trait_type} |
                      <strong>{home.attributes[4].value}</strong> {home.attributes[4].trait_type} |
                    </p>
                  }
                  <p>{home.address}</p>
                </div>
              </div>
            ))
          }
        </div>
      </div>
      {
        toggle &&
        <Home
          home={home}
          provider={provider}
          account={account}
          escrow={escrow}
          togglePop={handleClick}
        />
      }
    </div>
  );
}

export default App;
