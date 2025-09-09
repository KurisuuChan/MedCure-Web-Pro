// Run this in browser console to check the exact field structure
window.unifiedTransactionService.getTransactions({ limit: 1 }).then(transactions => {
    const sample = transactions[0];
    console.log("🔍 Transaction Data Structure:");
    console.log("All fields:", Object.keys(sample));
    console.log("Total field options:", {
        total: sample.total,
        total_amount: sample.total_amount,
        amount: sample.amount
    });
    console.log("Full transaction:", sample);
});
