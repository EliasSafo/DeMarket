import React, { useState } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

const TransporterForm = ({ products, web3, handleCreateDistributor }) => {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [fee, setFee] = useState('');

  const handleSubmit = () => {
    handleCreateDistributor(selectedProduct, fee);
  };

  return (
      <div>
        <h3>Create Transporter</h3>
        <TextField
            select
            label="Select Product"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            SelectProps={{ native: true }}
            fullWidth
            margin="normal"
        >
          <option value="" disabled>Select a product</option>
          {products.map((product) => (
              <option key={product.address} value={product.address}>
                {product.name}
              </option>
          ))}
        </TextField>
        <TextField
            label="Transporter Fee (ETH)"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            fullWidth
            margin="normal"
        />
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Create Transporter
        </Button>
      </div>
  );
};

export default TransporterForm;
