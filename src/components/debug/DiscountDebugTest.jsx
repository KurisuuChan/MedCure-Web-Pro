import React, { useState } from 'react';
import DiscountSelector from '../features/pos/DiscountSelector';

const DiscountDebugTest = () => {
  const [discountData, setDiscountData] = useState(null);
  const [subtotal] = useState(1000); // Fixed subtotal for testing

  const handleDiscountChange = (data) => {
    console.log("🧪 [DiscountDebugTest] Received discount data:", data);
    setDiscountData(data);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Discount Debug Test</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Test Subtotal: ₱{subtotal.toFixed(2)}</h2>
      </div>

      <DiscountSelector 
        onDiscountChange={handleDiscountChange}
        subtotal={subtotal}
      />

      {discountData && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Discount Data Debug:</h3>
          <pre className="text-sm bg-white p-3 rounded border overflow-auto">
            {JSON.stringify(discountData, null, 2)}
          </pre>
          
          <div className="mt-4 p-3 bg-blue-50 rounded border">
            <h4 className="font-medium mb-2">Calculation Check:</h4>
            <p>Subtotal: ₱{subtotal.toFixed(2)}</p>
            <p>Discount Type: {discountData.type}</p>
            <p>Discount Percentage: {discountData.percentage}%</p>
            <p>Discount Amount: ₱{discountData.amount?.toFixed(2) || '0.00'}</p>
            <p>Final Total: ₱{discountData.finalTotal?.toFixed(2) || '0.00'}</p>
            <p>Is Valid: {discountData.isValid ? 'Yes' : 'No'}</p>
            <p>ID Number: {discountData.idNumber || 'None'}</p>
            <p>Holder Name: {discountData.holderName || 'None'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountDebugTest;