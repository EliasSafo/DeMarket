import React, { useState } from 'react';
import AddProductForm from '../AddProductForm/AddProductForm';
import ProductList from '../ProductList/ProductList';
import DistributorInfo from '../DistributorInfo/DistributorInfo';
import { getTransporters } from '../../utils/web3Utils';
import Modal from 'react-modal';
import axios from 'axios';
import FormData from 'form-data';

Modal.setAppElement('#root'); // This is important for accessibility, replace #root with your app element if different

const SellerView = ({ products, setProducts, handleAddProduct, web3, contractAbi, accounts }) => {
    const [productName, setProductName] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [selectedFile, setSelectedFile] = useState(null); // New state for file upload
    const [uploading, setUploading] = useState(false);
    const [tab, setTab] = useState('newProduct');
    const [distributors, setDistributors] = useState([[], []]);
    const [showDistributors, setShowDistributors] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI2NDE3ZDNmYy03NWZhLTRhMWEtYTkxMi00ODRiYTQ2MzM0MGYiLCJlbWFpbCI6ImVsaWFzc2Fmb0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJpZCI6IkZSQTEiLCJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MX0seyJpZCI6Ik5ZQzEiLCJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MX1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiMjgxODJkMjdiY2JiN2I3ZTRjMGYiLCJzY29wZWRLZXlTZWNyZXQiOiI0ODRlYWI4YjJmOWE5MDMyMmI5Yjg5MWIwMDczYmNiM2YyNzYzODgxNmI3NGRiNTcwNGEyMDBlYTdjZmZkODdiIiwiaWF0IjoxNzI0MzUwMjQxfQ.nrCVTq19me0qvSbJnwswJQ9th1PTvWLjyfT8_CduB8Y'; // Replace with your actual JWT

    const handleTabChange = (newTab) => {
        setTab(newTab);
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const pinFileToIPFS = async () => {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const pinataMetadata = JSON.stringify({ name: productName });
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

    const addProduct = async () => {
        if (!productName || !productPrice || !selectedFile) {
            alert('Please fill in all fields and upload a file.');
            return;
        }

        const cid = await pinFileToIPFS();
        if (cid) {
            handleAddProduct(productName, productPrice, cid);
            setProductName('');
            setProductPrice('');
            setSelectedFile(null);
        }
    };

    const handleShowDistributors = async (product) => {
        console.log('product:', product);
        const transporterData = await getTransporters(web3, product.address);
        setDistributors(transporterData);
        setSelectedProduct(product);
        setShowDistributors(true);
    };

    const handleCloseDistributors = () => {
        setShowDistributors(false);
        setDistributors([[], []]); // Reset to empty array structure
        setSelectedProduct(null);
    };

    const handleSelectTransporter = async (transporterAddress, feeInWei) => {
        if (!selectedProduct) return;

        try {
            const productContract = new web3.eth.Contract(contractAbi, selectedProduct.address);
            await productContract.methods.setTransporter(transporterAddress).send({
                from: accounts[0],
                value: feeInWei, // Ensure fee is sent in wei
            });

            console.log('Transporter set successfully!');

            setSelectedProduct(prevState => ({ ...prevState, transporter: transporterAddress }));

            const updatedProducts = products.map(product =>
                product.address === selectedProduct.address ? { ...product, transporter: transporterAddress } : product
            );

            setProducts(updatedProducts);

            setShowDistributors(false);
            setDistributors([[], []]);
            setSelectedProduct(null);

        } catch (error) {
            console.error('Error setting transporter:', error);
        }
    };

    return (
        <div className="seller-view">
            <div className="tabs" style={{ float: 'left', width: '15%', height: '100vh', backgroundColor: '#f1f1f1' }}>
                <button className={tab === 'newProduct' ? 'active' : ''} onClick={() => handleTabChange('newProduct')}>New Product</button>
                <button className={tab === 'inProgress' ? 'active' : ''} onClick={() => handleTabChange('inProgress')}>In Progress</button>
                <button className={tab === 'delivered' ? 'active' : ''} onClick={() => handleTabChange('delivered')}>Delivered</button>
            </div>
            <div style={{ marginLeft: '15%', padding: '10px' }}>
                <div className="content">
                    {tab === 'newProduct' && (
                        <>
                            <AddProductForm
                                productName={productName}
                                setProductName={setProductName}
                                productPrice={productPrice}
                                setProductPrice={setProductPrice}
                                handleFileChange={handleFileChange} // Pass file change handler
                                handleAddProduct={addProduct}
                                uploading={uploading} // Pass uploading state
                            />
                            <ProductList
                                products={products}
                                web3={web3}
                                showButton={false}
                                handleBuyProduct={undefined}
                                handleShowDistributors={handleShowDistributors}
                            />
                        </>
                    )}
                    {tab === 'inProgress' && (
                        <ProductList
                            products={products}
                            web3={web3}
                            showButton={false}
                            handleBuyProduct={undefined}
                            handleShowDistributors={handleShowDistributors}
                        />
                    )}
                    {tab === 'delivered' && (
                        <ProductList
                            products={products}
                            web3={web3}
                            showButton={false}
                            handleBuyProduct={undefined}
                            handleShowDistributors={handleShowDistributors}
                        />
                    )}
                </div>
            </div>
            <DistributorInfo
                selectedProduct={selectedProduct}
                distributors={distributors}
                onClose={handleCloseDistributors}
                isOpen={showDistributors}
                onSelectTransporter={handleSelectTransporter}
            />
        </div>
    );
};

export default SellerView;
