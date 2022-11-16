import logo from '../assets/logo.svg';

const Navigation = ({ account, setAccount }) => {

    const handleConnect = async () => {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
    }

    return (
        <nav>
            <ul className='nav__links'>
                <li><a href='#'>Buy</a></li>
                <li><a href='#'>Rent</a></li>
                <li><a href='#'>Sell</a></li>
            </ul>

            <div className='nav__brand'>
                <img src={logo} alt="Logo" />
                <h1>Smart Estate</h1>
            </div>

            {
                account ?
                    <button
                        type='button'
                        className='nav__connect'
                    >
                        {account.substring(0, 5)}...{account.substring(38)}
                    </button>
                    :
                    <button
                        type='button'
                        className='nav__connect'
                        onClick={handleConnect}
                    >
                        Connect Wallet
                    </button>
            }
        </nav>
    )
}

export default Navigation;
