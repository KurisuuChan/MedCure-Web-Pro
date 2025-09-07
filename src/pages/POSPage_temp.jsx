      {/* Receipt Modal */}
      {showReceipt && lastTransaction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="text-center mb-4">
                <Receipt className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Transaction Complete
                </h2>
                <p className="text-gray-600">Receipt #{lastTransaction.id}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4 font-mono text-sm">
                <div className="text-center border-b pb-2 mb-2">
                  <h3 className="font-bold">MEDCURE PRO</h3>
                  <p className="text-xs">Pharmacy Management System</p>
                </div>

                <div className="space-y-1 border-b pb-2 mb-2">
                  {lastTransaction.items.map((item) => (
                    <div
                      key={`${item.id}-${item.quantity}`}
                      className="flex justify-between"
                    >
                      <span>
                        {item.name} x{item.quantity}
                      </span>
                      <span>{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(lastTransaction.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatCurrency(lastTransaction.tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-1">
                    <span>Total:</span>
                    <span>{formatCurrency(lastTransaction.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment ({lastTransaction.payment.method}):</span>
                    <span>
                      {formatCurrency(lastTransaction.payment.amount)}
                    </span>
                  </div>
                  {lastTransaction.payment.amount > lastTransaction.total && (
                    <div className="flex justify-between">
                      <span>Change:</span>
                      <span>
                        {formatCurrency(
                          lastTransaction.payment.amount - lastTransaction.total
                        )}
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-center border-t pt-2 mt-2">
                  <p>{lastTransaction.date ? new Date(lastTransaction.date).toLocaleString() : new Date().toLocaleString()}</p>
                  <p className="text-xs">Thank you for your business!</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowReceipt(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
