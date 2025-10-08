console.log("🧪 =================================");
console.log("🧪 PWD/SENIOR NAME DEBUGGING TEST");
console.log("🧪 =================================");

// Test function to trace PWD holder name through the entire flow
window.debugPWDHolderName = function() {
  console.log("🧪 [DEBUG] Starting PWD holder name trace...");
  
  // Check if there's current discount data in localStorage or state
  const posState = JSON.parse(localStorage.getItem('pos-store') || '{}');
  console.log("🧪 [LocalStorage] POS State:", posState);
  
  // Check current DOM for discount selector values
  const pwdRadio = document.querySelector('input[value="pwd"]');
  const idInput = document.querySelector('input[placeholder*="ID"]');
  const nameInput = document.querySelector('input[placeholder*="name" i], input[placeholder*="holder" i]');
  
  console.log("🧪 [DOM] Discount Selector Elements:", {
    pwdRadioChecked: pwdRadio?.checked,
    idInputValue: idInput?.value,
    nameInputValue: nameInput?.value,
    nameInputPlaceholder: nameInput?.placeholder
  });
  
  // Check if there are any recent console logs
  console.log("🧪 [Instructions] To test the flow:");
  console.log("1. Select PWD discount");
  console.log("2. Enter ID: PWD123456");
  console.log("3. Enter name: Test Holder Name");
  console.log("4. Add item to cart and checkout");
  console.log("5. Complete transaction");
  console.log("6. Check console for all debug messages");
  
  return "Debug function ready - follow instructions above";
};

// Auto-run the debug function
window.debugPWDHolderName();