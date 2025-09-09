// Transaction Editing Debug Console Commands
// Run these in the browser console to debug transaction editing

// 1. Test if we have any sales data
console.log("🔍 Testing transaction editing functionality...");

// Function to create test transaction data
window.createTestTransaction = async () => {
  console.log("🛠 Creating test transaction data...");

  // You can run this in browser console to create test data
  const testSale = {
    cashierId: "test-user",
    total: 150.0,
    paymentMethod: "cash",
    customer: { name: "Test Customer", phone: "09123456789" },
    items: [
      {
        product_id: 1,
        name: "Paracetamol 500mg",
        quantity: 2,
        unit_quantity: 2,
        unit_type: "piece",
        price_per_unit: 25.0,
        total_price: 50.0,
      },
      {
        product_id: 2,
        name: "Amoxicillin 250mg",
        quantity: 1,
        unit_quantity: 1,
        unit_type: "piece",
        price_per_unit: 100.0,
        total_price: 100.0,
      },
    ],
  };

  try {
    // This would create a test transaction (if services are available)
    console.log("📋 Test transaction data prepared:", testSale);
    console.log("💡 To create actual transaction, use POS interface or run:");
    console.log("    await salesService.processSale(testSale)");
    return testSale;
  } catch (error) {
    console.error("❌ Error creating test transaction:", error);
  }
};

// Function to test edit button functionality
window.testEditButton = () => {
  console.log("🔍 Testing edit button click...");

  // Find edit buttons on the page
  const editButtons = document.querySelectorAll(
    'button[title="Edit Transaction"]'
  );
  console.log(`📊 Found ${editButtons.length} edit buttons`);

  if (editButtons.length > 0) {
    console.log("✅ Edit buttons found. Check if they are clickable...");
    editButtons.forEach((btn, index) => {
      console.log(`🔘 Edit button ${index + 1}:`, {
        disabled: btn.disabled,
        visible: btn.offsetParent !== null,
        hasClickHandler: !!btn.onclick,
      });
    });
  } else {
    console.log("❌ No edit buttons found. Check if:");
    console.log("   - Transaction history is loaded");
    console.log("   - Transactions are within 24 hour edit window");
    console.log("   - User has proper permissions");
  }
};

// Function to check transaction history
window.checkTransactionHistory = () => {
  console.log("📊 Checking transaction history...");

  // Look for transaction history elements
  const transactions = document.querySelectorAll(
    '[class*="transaction-item"], [class*="bg-white rounded-lg"]'
  );

  console.log("📋 Transaction elements found:", transactions.length);

  if (transactions.length === 0) {
    console.log("❌ No transaction elements found. Possible issues:");
    console.log("   - No transactions exist for today");
    console.log("   - Transaction history not loaded");
    console.log("   - Component not rendering correctly");
  } else {
    console.log(
      "✅ Transaction elements found. Check console for transaction data..."
    );
  }
};

// Function to check for modal
window.checkTransactionModal = () => {
  console.log("🔍 Checking for transaction editor modal...");

  const modal = document.querySelector('[class*="fixed inset-0"]');
  const editor = document.querySelector('[class*="TransactionEditor"]');

  console.log("📋 Modal state:", {
    modalExists: !!modal,
    editorExists: !!editor,
    modalVisible: modal && modal.style.display !== "none",
  });

  if (!modal && !editor) {
    console.log("❌ No modal found. Transaction editor may not be opening.");
  }
};

// Auto-run basic checks
setTimeout(() => {
  console.log("🚀 Auto-running transaction editing checks...");
  window.checkTransactionHistory();
  window.testEditButton();
}, 2000);

console.log("✅ Transaction editing debug functions loaded!");
console.log("🔧 Available functions:");
console.log("   - createTestTransaction()");
console.log("   - testEditButton()");
console.log("   - checkTransactionHistory()");
console.log("   - checkTransactionModal()");
console.log("💡 Navigate to POS page and toggle transaction history to test");
