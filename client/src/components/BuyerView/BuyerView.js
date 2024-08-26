import React, { useState, useEffect } from 'react';
import ProductList from '../ProductList/ProductList';
import ProductABI from '../../abis/ProductEscrow.json'
const BuyerView = ({ products, web3, accounts, handleBuyProduct }) => {
    const [tab, setTab] = useState('sale');
    const [search, setSearch] = useState('');
    const [vcList, setVcList] = useState([]);  // Initialize vcList state

    const handleTabChange = (newTab) => {
        setTab(newTab);
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
    };

    const fetchVcList = async () => {
        try {
            const vcList = [];
            for (let product of products) {
                const productContract = new web3.eth.Contract(ProductABI.abi, product.address);
                const events = await productContract.getPastEvents('OrderConfirmed', {
                    filter: { buyer: accounts[0] },
                    fromBlock: 0,
                    toBlock: 'latest'
                });

                for (let event of events) {
                    vcList.push({
                        vcCID: event.returnValues.vcCID,
                        productName: product.name,
                        price: product.price,
                    });
                }
            }
            setVcList(vcList);
        } catch (error) {
            console.error('Error fetching VCs:', error);
        }
    };

    useEffect(() => {
        if (tab === 'vcs') {
            fetchVcList(); // Fetch VCs when the "VCs" tab is selected
        }
    }, [tab]);

    const filteredProducts = search
        ? products.filter(product =>
            product.name.toLowerCase().includes(search.toLowerCase())
        )
        : products;

    return (
        <div className="buyer-view">
            <div className="tabs" style={{ float: 'left', width: '10%' }}>
                <button onClick={() => handleTabChange('sale')}>Sale</button>
                <button onClick={() => handleTabChange('inProgress')}>In Progress</button>
                <button onClick={() => handleTabChange('vcs')}>VCs</button>
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
                            products={filteredProducts}
                            web3={web3}
                            showButton={true}
                            handleBuyProduct={handleBuyProduct}
                        />
                    )}
                    {tab === 'inProgress' && (
                        <ProductList
                            products={filteredProducts}
                            web3={web3}
                            showButton={false}
                        />
                    )}
                    {tab === 'vcs' && (
                        <div>
                            <h2>Your Verifiable Credentials (VCs)</h2>
                            {vcList.length === 0 ? (
                                <p>No VCs found.</p>
                            ) : (
                                <ul>
                                    {vcList.map((vc, index) => (
                                        <li key={index}>
                                            <p><strong>Product:</strong> {vc.productName}</p>
                                            <p><strong>VC CID:</strong> {vc.vcCID}</p>
                                            <p><strong>Price:</strong> {web3.utils.fromWei(vc.price.toString(), 'ether')} ETH</p>
                                            <a
                                                href={`https://plum-eligible-puma-63.mypinata.cloud/ipfs/${vc.vcCID}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                download
                                            >
                                                View VC
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BuyerView;
