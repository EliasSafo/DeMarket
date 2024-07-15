import React from 'react';

const ProductList = ({ products, web3, handlePurchaseProduct, showPurchaseButton }) => {
    return (
        <div>
            <h2>Products on Sale</h2>
            <table>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Price (ETH)</th>
                    <th>Owner</th>
                    {showPurchaseButton && <th>Purchase</th>}
                </tr>
                </thead>
                <tbody>
                {products.map((product, index) => (
                    <tr key={product.address}>
                        <td>{index + 1}</td>
                        <td>{product.name}</td>
                        <td>{web3.utils.fromWei(product.price.toString(), 'ether')} ETH</td>
                        <td>{product.owner}</td>
                        {showPurchaseButton && (
                            <td>
                                <button type="button" onClick={() => handlePurchaseProduct(product.address, product.price)}>
                                    Purchase
                                </button>
                            </td>
                        )}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default ProductList;
