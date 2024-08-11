import React, { useState } from 'react';
import ProductList from '../ProductList/ProductList';

const BuyerView = ({ products, web3, handleBuyProduct, accounts }) => {
    const [tab, setTab] = useState('sale');
    const [search, setSearch] = useState('');

    const handleTabChange = (newTab) => {
        setTab(newTab);
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
    };

    const filteredProducts = search
        ? products.filter(product =>
            product.name.toLowerCase().includes(search.toLowerCase())
        )
        : products;

    const productsForSale = filteredProducts.filter(product =>
        !product.purchased && product.owner !== accounts[0]
    );

    const productsInProgress = filteredProducts.filter(product =>
        product.purchased && product.buyer === accounts[0]
    );

    return (
        <div className="buyer-view">
            <div className="tabs" style={{ float: 'left', width: '10%' }}>
                <button onClick={() => handleTabChange('sale')}>Sale</button>
                <button onClick={() => handleTabChange('inProgress')}>In Progress</button>
            </div>
            <div>
                <div className="search">
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={handleSearchChange}
                    />
                </div>
                <div className="content">
                    {tab === 'sale' && (
                        <ProductList
                            products={products}//add filter
                            web3={web3}
                            showButton={true}
                            handleBuyProduct={handleBuyProduct}
                        />
                    )}
                    {tab === 'inProgress' && (
                        <ProductList
                            products={products}//add filter
                            web3={web3}
                            showButton={false} // No buy button needed for in-progress purchases
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default BuyerView;
