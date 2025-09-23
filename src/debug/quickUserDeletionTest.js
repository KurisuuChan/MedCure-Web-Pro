/**
 * Quick User Deletion Test & Fix Script
 * Run this in browser console to identify and fix user deletion issues
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Quick diagnostic test
async function quickUserDeletionDiagnostic() {
  console.log('🔍 QUICK USER DELETION DIAGNOSTIC');
  console.log('================================');
  
  try {
    // Test 1: Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError?.message || 'No user');
      return { issue: 'authentication', fix: 'User needs to log in' };
    }
    
    console.log('✅ Authenticated as:', user.email);
    
    // Test 2: Check current user in database
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select('id, email, role, is_active, first_name, last_name')
      .eq('email', user.email)
      .single();
      
    if (currentUserError) {
      console.error('❌ Current user not found in database:', currentUserError.message);
      return { issue: 'user_not_in_db', fix: 'User profile missing in database' };
    }
    
    console.log('✅ Current user found:', currentUser.first_name, currentUser.last_name, `(${currentUser.role})`);
    
    // Test 3: Check permissions
    const adminRoles = ['admin', 'manager', 'super_admin'];
    if (!adminRoles.includes(currentUser.role)) {
      console.error('❌ Insufficient permissions. Current role:', currentUser.role);
      return { issue: 'permissions', fix: 'User needs admin or manager role' };
    }
    
    console.log('✅ Permission check passed:', currentUser.role);
    
    // Test 4: Check if we can read users table
    const { data: allUsers, error: readError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, is_active')
      .limit(5);
      
    if (readError) {
      console.error('❌ Cannot read users table:', readError.message);
      return { issue: 'table_access', fix: 'Check RLS policies for SELECT', error: readError };
    }
    
    console.log(`✅ Can read users table: ${allUsers?.length || 0} users found`);
    
    // Test 5: Try to update a user (harmless update)
    if (allUsers && allUsers.length > 0) {
      const testUser = allUsers.find(u => u.id !== currentUser.id) || allUsers[0];
      
      console.log('🧪 Testing update permissions on user:', testUser.email);
      
      const { data: updateResult, error: updateError } = await supabase
        .from('users')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', testUser.id)
        .select()
        .single();
        
      if (updateError) {
        console.error('❌ Cannot update users:', updateError.message);
        return { 
          issue: 'update_access', 
          fix: 'Check RLS policies for UPDATE', 
          error: updateError,
          testUserId: testUser.id
        };
      }
      
      console.log('✅ Update test successful:', updateResult.email);
      
      // Test 6: Try soft delete (the actual deletion process)
      console.log('🗑️ Testing soft delete functionality...');
      
      // Find an inactive user or create a test scenario
      const inactiveUser = allUsers.find(u => !u.is_active && u.id !== currentUser.id);
      
      if (inactiveUser) {
        console.log('🧪 Testing with inactive user:', inactiveUser.email);
        
        const { data: deleteResult, error: deleteError } = await supabase
          .from('users')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', inactiveUser.id)
          .select()
          .single();
          
        if (deleteError) {
          console.error('❌ Soft delete failed:', deleteError.message);
          return { 
            issue: 'soft_delete_failed', 
            fix: 'Check RLS policies and database constraints', 
            error: deleteError 
          };
        }
        
        console.log('✅ Soft delete test successful');
        
      } else {
        console.log('ℹ️ No inactive users found for safe testing');
      }
    }
    
    console.log('✅ All tests passed! User deletion should work.');
    return { status: 'success', message: 'User deletion functionality appears to be working' };
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    return { issue: 'unknown_error', fix: 'Check console for details', error };
  }
}

// Enhanced user deletion function with detailed error handling
async function enhancedDeleteUser(userId, options = {}) {
  console.log('🗑️ Enhanced User Deletion Started');
  console.log('================================');
  console.log('Target User ID:', userId);
  
  try {
    // Step 1: Validate input
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Step 2: Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication required for user deletion');
    }
    
    console.log('✅ Authenticated as:', user.email);
    
    // Step 3: Get current user permissions
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select('id, email, role, is_active, first_name, last_name')
      .eq('email', user.email)
      .single();
      
    if (currentUserError) {
      console.error('Current user lookup error:', currentUserError);
      throw new Error(`Current user not found: ${currentUserError.message}`);
    }
    
    console.log('✅ Current user found:', currentUser.first_name, currentUser.last_name);
    
    // Step 4: Check permissions
    const adminRoles = ['admin', 'manager', 'super_admin'];
    if (!adminRoles.includes(currentUser.role)) {
      throw new Error(`Insufficient permissions. Required: admin/manager, Current: ${currentUser.role}`);
    }
    
    if (!currentUser.is_active) {
      throw new Error('Current user account is inactive');
    }
    
    console.log('✅ Permission check passed:', currentUser.role);
    
    // Step 5: Get target user
    const { data: targetUser, error: targetError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (targetError) {
      console.error('Target user lookup error:', targetError);
      
      if (targetError.code === 'PGRST116') {
        throw new Error('User not found');
      } else {
        throw new Error(`Database error: ${targetError.message}`);
      }
    }
    
    console.log('✅ Target user found:', targetUser.email, `(${targetUser.role})`);
    
    // Step 6: Business logic validations
    if (targetUser.id === currentUser.id) {
      throw new Error('Cannot delete your own account');
    }
    
    if (!targetUser.is_active && !options.forceReactivation) {
      throw new Error('User is already inactive');
    }
    
    // Step 7: Perform the deletion
    console.log('🔄 Performing soft delete...');
    
    const updateData = {
      is_active: false,
      updated_at: new Date().toISOString()
    };
    
    // Add audit fields if they exist
    const { data: tableInfo } = await supabase.rpc('get_table_columns', { table_name: 'users' }).catch(() => ({ data: null }));
    
    if (tableInfo && tableInfo.some(col => col.column_name === 'deleted_at')) {
      updateData.deleted_at = new Date().toISOString();
      updateData.deleted_by = currentUser.id;
      updateData.deletion_reason = options.reason || 'Deleted by admin';
    }
    
    const { data: deletedUser, error: deleteError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();
      
    if (deleteError) {
      console.error('Delete operation error:', deleteError);
      
      // Provide specific error messages
      if (deleteError.code === 'RLS_VIOLATION' || deleteError.message.includes('permission')) {
        throw new Error('Permission denied. Check Row Level Security policies.');
      } else if (deleteError.code === 'FOREIGN_KEY_VIOLATION') {
        throw new Error('Cannot delete user: related records exist.');
      } else {
        throw new Error(`Database error: ${deleteError.message}`);
      }
    }
    
    console.log('✅ User successfully deactivated:', deletedUser.email);
    
    return {
      success: true,
      deletedUser: {
        id: deletedUser.id,
        email: deletedUser.email,
        first_name: deletedUser.first_name,
        last_name: deletedUser.last_name,
        role: deletedUser.role,
        deleted_at: deletedUser.deleted_at || new Date().toISOString()
      },
      deletedBy: {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role
      },
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Enhanced user deletion failed:', error);
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      userId
    };
  }
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.quickUserDeletionDiagnostic = quickUserDeletionDiagnostic;
  window.enhancedDeleteUser = enhancedDeleteUser;
  
  console.log('🔧 Quick User Deletion Diagnostic loaded!');
  console.log('');
  console.log('Available functions:');
  console.log('  • quickUserDeletionDiagnostic() - Run diagnostic test');
  console.log('  • enhancedDeleteUser(userId) - Delete user with detailed logging');
  console.log('');
  console.log('Usage:');
  console.log('  1. Run quickUserDeletionDiagnostic() to identify issues');
  console.log('  2. Use enhancedDeleteUser("user-id-here") to delete a user');
  console.log('');
}

export { quickUserDeletionDiagnostic, enhancedDeleteUser };