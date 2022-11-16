import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

import close from '../assets/close.svg';

const Home = ({ home, provider, escrow, togglePop }) => {

    return (
        <div className='card'>
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
    );
}

export default Home;
