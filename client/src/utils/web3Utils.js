import Web3 from 'web3';
import ProductABI from '../abis/ProductEscrow.json';

export const getTransporters = async (web3, productAddress) => {
    try {
        console.log('productAddress getTransporters:',productAddress)
        const productContract = new web3.eth.Contract(ProductABI.abi, productAddress);
        const transporterData = await productContract.methods.getAllTransporters().call();
        return transporterData; // This should always return [[], []] structure
    } catch (error) {
        console.error("Error fetching transporters:", error);
        return [[], []]; // Ensure it returns an array structure
    }
};

