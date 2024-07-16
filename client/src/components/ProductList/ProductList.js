import React from 'react';
import Button from '@mui/material/Button';

const ProductList = ({ products, web3, handlePurchaseProduct, handleDelivery, showPurchaseButton }) => {
  return (
    <div>
      <h3>Products</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Price (ETH)</th>
            <th>Owner</th>
            <th>Purchased</th>
            {showPurchaseButton ? <th>Purchase</th> : <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.address}>
              <td>{product?.id?.toString()}</td>
              <td>{product?.name}</td>
              <td>{web3.utils.fromWei(product?.price.toString(), 'ether')} ETH</td>
              <td>{product?.owner}</td>
              <td>{product?.purchased ? 'Yes' : 'No'}</td>
              {showPurchaseButton ? (
                <td>
                  <Button variant="contained" onClick={() => handlePurchaseProduct(product.address, product.price)}>
                    Purchase
                  </Button>
                </td>
              ) : (
                <td>
                  {product?.purchased && (
                    <Button variant="contained" onClick={() => handleDelivery(product.address)}>
                      Withdraw Funds
                    </Button>
                  )}
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
