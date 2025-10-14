import React, { useState } from 'react';
import CustomerDeleteModal from './CustomerDeleteModal';

const CustomerDeleteModalDemo = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const mockCustomer = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    customer_name: 'John Doe',
    phone: '09123456789',
    email: 'john.doe@email.com',
    address: '123 Main St, City'
  };

  const handleSoftDelete = async (customerId) => {
    setIsLoading(true);
    console.log('Soft deleting customer:', customerId);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    setIsModalOpen(false);
    alert('Customer hidden successfully!');
  };

  const handlePermanentDelete = async (customerId) => {
    setIsLoading(true);
    console.log('Permanently deleting customer:', customerId);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsLoading(false);
    setIsModalOpen(false);
    alert('Customer anonymized successfully!');
  };

  return (
    <div className="p-8">
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Customer Delete Modal Demo
        </h2>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
          <h3 className="font-medium text-gray-900 mb-2">Sample Customer</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div><strong>Name:</strong> {mockCustomer.customer_name}</div>
            <div><strong>Phone:</strong> {mockCustomer.phone}</div>
            <div><strong>Email:</strong> {mockCustomer.email}</div>
            <div><strong>ID:</strong> {mockCustomer.id}</div>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Open Delete Modal
        </button>

        <div className="mt-6 text-sm text-gray-600">
          <h4 className="font-medium mb-2">Modal Features:</h4>
          <ul className="space-y-1 text-xs">
            <li>✅ Two deletion options: Soft Delete (Safe) vs Complete Anonymization</li>
            <li>✅ Clear visual indicators and warnings</li>
            <li>✅ Confirmation required for permanent deletion</li>
            <li>✅ Loading states and proper error handling</li>
            <li>✅ Preserves transaction history explanation</li>
            <li>✅ Professional UI with proper accessibility</li>
          </ul>
        </div>
      </div>

      <CustomerDeleteModal
        customer={mockCustomer}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSoftDelete={handleSoftDelete}
        onPermanentDelete={handlePermanentDelete}
        isLoading={isLoading}
      />
    </div>
  );
};

export default CustomerDeleteModalDemo;