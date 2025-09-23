/**
 * User Deletion Test Console Script
 * Copy and paste this into your browser console to test user deletion
 */

// Import the UserManagementService (this should work if the service is properly loaded)
// If it doesn't work, you can copy the enhanced version below

console.log('🧪 USER DELETION TEST SUITE');
console.log('============================');

// Test function to diagnose user deletion issues
async function testUserDeletion() {
  try {
    console.log('🔍 Running user deletion diagnostic...');
    
    // Step 1: Check if UserManagementService is available
    if (typeof UserManagementService === 'undefined') {
      console.error('❌ UserManagementService not found');
      return;
    }
    
    // Step 2: Get all users to find a test candidate
    const users = await UserManagementService.getAllUsers();
    console.log(`📊 Found ${users?.length || 0} users`);
    
    if (!users || users.length === 0) {
      console.error('❌ No users found to test with');
      return;
    }
    
    // Step 3: Find a suitable test user (not the current user)
    const { data: { user: currentAuthUser } } = await supabase.auth.getUser();
    const testUser = users.find(u => 
      u.email !== currentAuthUser?.email && 
      u.role !== 'admin' && 
      u.is_active === true
    );
    
    if (!testUser) {
      console.warn('⚠️ No suitable test user found (avoiding admin/current user)');
      console.log('Available users:', users.map(u => ({ 
        email: u.email, 
        role: u.role, 
        is_active: u.is_active 
      })));
      return;
    }
    
    console.log(`🎯 Testing with user: ${testUser.email} (${testUser.role})`);
    
    // Step 4: Test the deletion
    console.log('🗑️ Attempting user deletion...');
    
    const result = await UserManagementService.deleteUser(testUser.id);
    
    if (result) {
      console.log('✅ User deletion successful!', result);
      
      // Step 5: Verify the user is now inactive
      const updatedUsers = await UserManagementService.getAllUsers();
      const deletedUser = updatedUsers.find(u => u.id === testUser.id);
      
      if (deletedUser && !deletedUser.is_active) {
        console.log('✅ Verification passed: User is now inactive');
      } else {
        console.warn('⚠️ User deletion may not have worked as expected');
      }
      
    } else {
      console.error('❌ User deletion returned no result');
    }
    
  } catch (error) {
    console.error('❌ User deletion test failed:', error.message);
    console.error('Full error:', error);
    
    // Provide troubleshooting suggestions
    if (error.message.includes('Authentication required')) {
      console.log('💡 Solution: Make sure you are logged in');
    } else if (error.message.includes('Insufficient permissions')) {
      console.log('💡 Solution: Make sure your account has admin or manager role');
    } else if (error.message.includes('permission') || error.message.includes('RLS')) {
      console.log('💡 Solution: Check Row Level Security policies in Supabase');
    } else if (error.message.includes('User not found')) {
      console.log('💡 Solution: The user ID may be invalid or the user may not exist');
    }
  }
}

// Quick fix function to test individual user deletion
async function quickDeleteUser(userId) {
  console.log(`🗑️ Quick delete test for user: ${userId}`);
  
  try {
    const result = await UserManagementService.deleteUser(userId);
    console.log('✅ Delete successful:', result);
    return result;
  } catch (error) {
    console.error('❌ Delete failed:', error.message);
    return { error: error.message };
  }
}

// Function to get current user info
async function getCurrentUserInfo() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ No authenticated user');
      return;
    }
    
    console.log('👤 Current authenticated user:', user.email);
    
    // Get user details from database
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single();
      
    if (error) {
      console.error('❌ Error fetching user details:', error);
      return;
    }
    
    console.log('📊 User details:', {
      name: `${userData.first_name} ${userData.last_name}`,
      email: userData.email,
      role: userData.role,
      is_active: userData.is_active,
      can_delete_users: ['admin', 'manager', 'super_admin'].includes(userData.role)
    });
    
    return userData;
    
  } catch (error) {
    console.error('❌ Error getting current user:', error);
  }
}

// Function to list all users
async function listAllUsers() {
  try {
    const users = await UserManagementService.getAllUsers();
    console.log('👥 All users:');
    console.table(users.map(u => ({
      Email: u.email,
      Name: `${u.first_name} ${u.last_name}`,
      Role: u.role,
      Active: u.is_active,
      ID: u.id
    })));
    
    return users;
  } catch (error) {
    console.error('❌ Error listing users:', error);
  }
}

// Make functions available globally
window.testUserDeletion = testUserDeletion;
window.quickDeleteUser = quickDeleteUser;
window.getCurrentUserInfo = getCurrentUserInfo;
window.listAllUsers = listAllUsers;

console.log('🔧 User Deletion Test Suite loaded!');
console.log('');
console.log('Available commands:');
console.log('  testUserDeletion()     - Run full diagnostic test');
console.log('  getCurrentUserInfo()   - Check current user permissions');
console.log('  listAllUsers()         - List all users in the system');
console.log('  quickDeleteUser(id)    - Quick delete test for specific user');
console.log('');
console.log('Example usage:');
console.log('  1. getCurrentUserInfo()  // Check your permissions');
console.log('  2. listAllUsers()        // See all users');
console.log('  3. testUserDeletion()    // Run the full test');
console.log('');