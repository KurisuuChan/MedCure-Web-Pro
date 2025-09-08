/**
 * 🧪 **MANAGEMENT PAGE TESTING HELPER**
 * Place this in browser console to test Management page functionality
 */

// Test function to be run in browser console
window.testManagementPage = async () => {
  console.log("🔍 Starting Management Page Test Suite...\n");

  try {
    // Test 1: Check if we can access the DashboardService
    const dashboardData = await window.DashboardService?.getDashboardData();
    console.log("1️⃣ Dashboard Service Test:", {
      available: !!window.DashboardService,
      dataLoaded: !!dashboardData,
      format: dashboardData
        ? {
            success: dashboardData.success,
            hasData: !!dashboardData.data,
          }
        : "No data",
    });

    // Test 2: Check UserService
    const userData = await window.UserService?.getUsers();
    console.log("2️⃣ User Service Test:", {
      available: !!window.UserService,
      dataLoaded: !!userData,
      format: userData
        ? {
            success: userData.success,
            count: userData.data?.length || 0,
          }
        : "No data",
    });

    // Test 3: Check CategoryService
    const categoryData = await window.CategoryService?.getAllCategories();
    console.log("3️⃣ Category Service Test:", {
      available: !!window.CategoryService,
      dataLoaded: !!categoryData,
      format: categoryData
        ? {
            success: categoryData.success,
            count: categoryData.data?.length || 0,
          }
        : "No data",
    });

    // Test 4: Check ArchiveService
    const archiveData = await window.ArchiveService?.getArchivedProducts();
    console.log("4️⃣ Archive Service Test:", {
      available: !!window.ArchiveService,
      dataLoaded: !!archiveData,
      format: archiveData
        ? {
            success: archiveData.success,
            count: archiveData.data?.length || 0,
          }
        : "No data",
    });

    console.log("\n✅ Management Page Test Suite Complete!");
  } catch (error) {
    console.error("❌ Test Suite Failed:", error);
  }
};

// Instructions for user
console.log(`
🧪 MANAGEMENT PAGE TESTING TOOL LOADED

To test the Management page functionality, run:
testManagementPage()

This will test all data services and their integration.
`);

export default {};
