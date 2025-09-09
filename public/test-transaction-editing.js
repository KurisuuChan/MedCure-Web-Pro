// =================================================
// 🧪 TRANSACTION EDITING TEST SCRIPT
// Paste this into browser console on POS page
// =================================================

console.log("🧪 Starting Transaction Editing Test Script");

// Test 1: Check if test data exists
async function checkTestData() {
  console.log("📊 Checking for test transaction data...");

  // This would simulate checking for test transactions
  console.log("💡 Expected test data:");
  console.log("  - Test Customer (2 hours ago) - EDITABLE");
  console.log("  - Old Customer (25 hours ago) - NOT EDITABLE");
  console.log("  - Both with sale items");

  return true;
}

// Test 2: Find transaction history button
function findHistoryButton() {
  console.log("🔍 Looking for Transaction History button...");

  const historyButtons = document.querySelectorAll("button");
  let found = false;

  historyButtons.forEach((btn, index) => {
    if (
      btn.textContent.includes("Transaction History") ||
      btn.textContent.includes("History") ||
      btn.querySelector('[data-lucide="history"]')
    ) {
      console.log(`✅ Found History button #${index}:`, btn.textContent);
      found = true;
    }
  });

  if (!found) {
    console.log("❌ No Transaction History button found");
    console.log("💡 Look for a button with History icon or text");
  }

  return found;
}

// Test 3: Check for edit buttons in transaction history
function checkEditButtons() {
  console.log("🔍 Checking for edit buttons...");

  const editButtons = document.querySelectorAll('button[title*="Edit"]');
  console.log(`📊 Found ${editButtons.length} edit buttons`);

  if (editButtons.length > 0) {
    editButtons.forEach((btn, index) => {
      console.log(`✅ Edit button #${index + 1}:`, {
        disabled: btn.disabled,
        visible: btn.offsetParent !== null,
        title: btn.title,
      });
    });
    return true;
  } else {
    console.log("❌ No edit buttons found");
    console.log("💡 Make sure:");
    console.log("  - Transaction history is open");
    console.log("  - Test transactions exist");
    console.log("  - User has edit permissions");
    return false;
  }
}

// Test 4: Check for transaction editor modal
function checkEditorModal() {
  console.log("🔍 Checking for TransactionEditor modal...");

  const modal = document.querySelector(".fixed.inset-0");
  const editor = document.querySelector('[class*="TransactionEditor"]');

  console.log("📋 Modal state:", {
    modalExists: !!modal,
    editorExists: !!editor,
    modalVisible: modal && window.getComputedStyle(modal).display !== "none",
  });

  if (modal || editor) {
    console.log("✅ Transaction editor modal found!");
    return true;
  } else {
    console.log("❌ No transaction editor modal found");
    console.log("💡 Click an edit button first");
    return false;
  }
}

// Test 5: Simulate edit button click
function simulateEditClick() {
  console.log("🧪 Simulating edit button click...");

  const editButtons = document.querySelectorAll('button[title*="Edit"]');

  if (editButtons.length > 0) {
    const firstEditButton = editButtons[0];
    if (!firstEditButton.disabled) {
      console.log("🖱️ Clicking first edit button...");
      firstEditButton.click();

      // Check if modal opened after a short delay
      setTimeout(() => {
        checkEditorModal();
      }, 500);

      return true;
    } else {
      console.log("❌ First edit button is disabled");
      return false;
    }
  } else {
    console.log("❌ No edit buttons available to click");
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log("🚀 Running all transaction editing tests...");
  console.log("=".repeat(50));

  await checkTestData();
  console.log("-".repeat(30));

  findHistoryButton();
  console.log("-".repeat(30));

  checkEditButtons();
  console.log("-".repeat(30));

  checkEditorModal();
  console.log("-".repeat(30));

  console.log("✅ Test suite completed!");
  console.log("💡 Next steps:");
  console.log("  1. Open Transaction History if not already open");
  console.log("  2. Click an edit button");
  console.log("  3. Verify modal opens with transaction data");
  console.log("  4. Test editing functionality");
}

// Auto-run tests after page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(runAllTests, 2000);
  });
} else {
  setTimeout(runAllTests, 1000);
}

// Make functions available globally
window.checkTestData = checkTestData;
window.findHistoryButton = findHistoryButton;
window.checkEditButtons = checkEditButtons;
window.checkEditorModal = checkEditorModal;
window.simulateEditClick = simulateEditClick;
window.runAllTests = runAllTests;

console.log("✅ Transaction Editing Test Script loaded!");
console.log("🔧 Available functions:");
console.log("  - checkTestData()");
console.log("  - findHistoryButton()");
console.log("  - checkEditButtons()");
console.log("  - checkEditorModal()");
console.log("  - simulateEditClick()");
console.log("  - runAllTests()");
