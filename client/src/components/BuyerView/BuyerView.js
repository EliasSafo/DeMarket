import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductList from '../ProductList/ProductList';
import ProductABI from '../../abis/ProductEscrow.json';

const BuyerView = ({ products, web3, accounts, handleBuyProduct }) => {
    const [tab, setTab] = useState('sale');
    const [search, setSearch] = useState('');
    const [vcList, setVcList] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [isConfirmingDelivery, setIsConfirmingDelivery] = useState(false); // Add this state

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

    const pinFileToIPFS = async () => {
        const dummyData = {
            productName: "Sample Product",
            deliveryDate: new Date().toISOString(),
            buyer: accounts[0],
            message: "This is a dummy VC file."
        };
        const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI2NDE3ZDNmYy03NWZhLTRhMWEtYTkxMi00ODRiYTQ2MzM0MGYiLCJlbWFpbCI6ImVsaWFzc2Fmb0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiYjgyYmIwODY3NDhjN2M5NGM4NTIiLCJzY29wZWRLZXlTZWNyZXQiOiI5NDZlOGI3MGZiYjJlOWUxM2Q4NmNmMDBlZTlkNGExMmUzOTQ4N2Y5ODgxYzk4NjM2YWJhMzczOGEyYzM5OGVhIiwiZXhwIjoxNzU2MzY1NjM2fQ.5g-GOhjyL9OtRPKko3rt73c8WJud9N_5Fd50xaFlOOg';


        const blob = new Blob([JSON.stringify(dummyData, null, 2)], { type: 'application/json' });
        const dummyFile = new File([blob], "dummyVC.json");

        const formData = new FormData();
        formData.append('file', dummyFile);

        const pinataMetadata = JSON.stringify({ name: "Dummy Verifiable Credential" });
        formData.append('pinataMetadata', pinataMetadata);

        const pinataOptions = JSON.stringify({ cidVersion: 0 });
        formData.append('pinataOptions', pinataOptions);

        try {
            setUploading(true);
            const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
                maxBodyLength: "Infinity",
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                    'Authorization': `Bearer ${JWT}`
                }
            });
            console.log('IPFS Hash:', res.data.IpfsHash);
            setUploading(false);
            return res.data.IpfsHash;
        } catch (error) {
            console.error('Error uploading file to IPFS:', error);
            setUploading(false);
            return null;
        }
    };

    const handleConfirmDelivery = async (productAddress) => {
        if (isConfirmingDelivery) return; // Prevent multiple triggers
        setIsConfirmingDelivery(true); // Set the confirming flag

        const vcCID = await pinFileToIPFS();
        if (!vcCID) {
            alert("Failed to upload file to IPFS.");
            setIsConfirmingDelivery(false); // Reset the flag
            return;
        }

        try {
            const productContract = new web3.eth.Contract(ProductABI.abi, productAddress);
            await productContract.methods.confirmDelivery(vcCID).send({
                from: accounts[0],
            });

            console.log('Delivery confirmed successfully with VC CID:', vcCID);
        } catch (error) {
            console.error('Error confirming delivery:', error);
        } finally {
            setIsConfirmingDelivery(false); // Reset the flag after confirmation
        }
    };

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
                        <>
                            <ProductList
                                products={filteredProducts}
                                web3={web3}
                                showButton={false}
                                handleBuyProduct={undefined}
                                handleConfirmDelivery={handleConfirmDelivery}
                            />
                        </>
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
