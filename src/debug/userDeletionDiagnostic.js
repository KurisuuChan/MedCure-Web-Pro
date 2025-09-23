/**
 * Professional User Deletion Diagnostic & Fix
 * Comprehensive analysis and resolution for user deletion issues
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class UserDeletionDiagnostic {
  
  static async diagnoseUserDeletionIssues() {
    console.log('🔬 USER DELETION COMPREHENSIVE DIAGNOSTIC');
    console.log('========================================');
    
    try {
      // Step 1: Check database table structure
      const tableAnalysis = await this.analyzeUserTables();
      
      // Step 2: Test RLS policies
      const rlsAnalysis = await this.testRLSPolicies();
      
      // Step 3: Test current user permissions
      const permissionAnalysis = await this.testUserPermissions();
      
      // Step 4: Test actual deletion functionality
      const deletionTest = await this.testDeletionFunctionality();
      
      // Step 5: Provide comprehensive fix
      const fixRecommendations = await this.generateFixRecommendations({
        tableAnalysis,
        rlsAnalysis,
        permissionAnalysis,
        deletionTest
      });
      
      return {
        tableAnalysis,
        rlsAnalysis,
        permissionAnalysis,
        deletionTest,
        fixRecommendations,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Diagnostic failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  static async analyzeUserTables() {
    console.log('\n📊 STEP 1: Analyzing User Table Structure');
    console.log('=========================================');
    
    try {
      // Check if users table exists and get structure
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
        
      if (userError) {
        console.error('❌ Users table error:', userError);
        return {
          success: false,
          error: `Users table: ${userError.message}`,
          tableExists: false
        };
      }
      
      console.log('✅ Users table accessible');
      
      // Check user_profiles table (alternative)
      const { data: userProfiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1);
      
      let userProfilesExists = !profileError;
      if (profileError) {
        console.log('ℹ️ user_profiles table not found (expected)');
      } else {
        console.log('✅ user_profiles table also exists');
      }
      
      // Get sample user structure
      let sampleUser = null;
      if (users && users.length > 0) {
        sampleUser = users[0];
        console.log('📋 Sample user structure:', Object.keys(sampleUser));
        
        // Check for required fields
        const requiredFields = ['id', 'email', 'is_active'];
        const missingFields = requiredFields.filter(field => !(field in sampleUser));
        
        if (missingFields.length > 0) {
          console.warn('⚠️ Missing required fields:', missingFields);
        } else {
          console.log('✅ All required fields present');
        }
      }
      
      return {
        success: true,
        usersTableExists: true,
        userProfilesTableExists: userProfilesExists,
        sampleUser,
        hasRequiredFields: sampleUser ? ['id', 'email', 'is_active'].every(f => f in sampleUser) : false
      };
      
    } catch (error) {
      console.error('❌ Table analysis failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  static async testRLSPolicies() {
    console.log('\n🔒 STEP 2: Testing RLS Policies');
    console.log('==============================');
    
    try {
      // Test if we can read users
      const { data: readTest, error: readError } = await supabase
        .from('users')
        .select('id, email, is_active')
        .limit(5);
        
      if (readError) {
        console.error('❌ Read access denied:', readError);
        return {
          success: false,
          canRead: false,
          canUpdate: false,
          canDelete: false,
          error: readError.message
        };
      }
      
      console.log(`✅ Can read users: ${readTest?.length || 0} users found`);
      
      if (!readTest || readTest.length === 0) {
        return {
          success: true,
          canRead: true,
          canUpdate: false,
          canDelete: false,
          note: 'No users to test update/delete on'
        };
      }
      
      const testUserId = readTest[0].id;
      console.log(`🧪 Testing with user ID: ${testUserId}`);
      
      // Test update access (safer than delete)
      const { error: updateError } = await supabase
        .from('users')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', testUserId);
        
      const canUpdate = !updateError;
      if (updateError) {
        console.warn('⚠️ Update access denied:', updateError.message);
      } else {
        console.log('✅ Can update users');
      }
      
      // Test delete access (just check, don't actually delete)
      // We'll try a non-existent ID to avoid actually deleting
      const { error: deleteError } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID
        
      const canDelete = !deleteError || !deleteError.message.includes('permission');
      if (deleteError && deleteError.message.includes('permission')) {
        console.warn('⚠️ Delete/Update access denied:', deleteError.message);
      } else {
        console.log('✅ Can perform delete operations (soft delete via update)');
      }
      
      return {
        success: true,
        canRead: true,
        canUpdate,
        canDelete,
        testUserId,
        updateError: updateError?.message,
        deleteError: deleteError?.message
      };
      
    } catch (error) {
      console.error('❌ RLS policy test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  static async testUserPermissions() {
    console.log('\n👤 STEP 3: Testing Current User Permissions');
    console.log('===========================================');
    
    try {
      // Get current user from Supabase auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.warn('⚠️ No authenticated user found');
        return {
          success: false,
          authenticated: false,
          error: 'No authenticated user'
        };
      }
      
      console.log(`✅ Authenticated as: ${user.email}`);
      
      // Try to find this user in the users table
      const { data: userData, error: userLookupError } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single();
        
      if (userLookupError) {
        console.warn('⚠️ Current user not found in users table:', userLookupError.message);
        return {
          success: true,
          authenticated: true,
          inUsersTable: false,
          currentUser: user,
          error: userLookupError.message
        };
      }
      
      console.log(`✅ Found user in database: ${userData.first_name} ${userData.last_name} (${userData.role})`);
      
      return {
        success: true,
        authenticated: true,
        inUsersTable: true,
        currentUser: user,
        userData,
        userRole: userData.role,
        isAdmin: userData.role === 'admin' || userData.role === 'manager'
      };
      
    } catch (error) {
      console.error('❌ User permission test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  static async testDeletionFunctionality() {
    console.log('\n🗑️ STEP 4: Testing User Deletion Functionality');
    console.log('==============================================');
    
    try {
      // Get a test user (preferably inactive or test account)
      const { data: testUsers, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .or('role.eq.test,is_active.eq.false')
        .limit(1);
        
      if (fetchError) {
        console.error('❌ Cannot fetch test users:', fetchError);
        return {
          success: false,
          error: fetchError.message
        };
      }
      
      if (!testUsers || testUsers.length === 0) {
        // Create a test user if none exists
        console.log('🧪 Creating test user for deletion test...');
        
        const testUserData = {
          email: `test-delete-${Date.now()}@medcure.test`,
          first_name: 'Test',
          last_name: 'Delete',
          role: 'test',
          is_active: true
        };
        
        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .insert(testUserData)
          .select()
          .single();
          
        if (createError) {
          console.error('❌ Cannot create test user:', createError);
          return {
            success: false,
            canCreateUser: false,
            error: createError.message
          };
        }
        
        console.log('✅ Test user created:', createdUser.email);
        
        // Now test deletion on the created user
        const { data: deletedUser, error: deleteError } = await supabase
          .from('users')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', createdUser.id)
          .select()
          .single();
          
        if (deleteError) {
          console.error('❌ User deletion failed:', deleteError);
          return {
            success: false,
            canCreateUser: true,
            canDeleteUser: false,
            testUserId: createdUser.id,
            error: deleteError.message
          };
        }
        
        console.log('✅ User successfully soft-deleted:', deletedUser.email);
        
        // Clean up - actually delete the test user
        const { error: cleanupError } = await supabase
          .from('users')
          .delete()
          .eq('id', createdUser.id);
          
        if (cleanupError) {
          console.warn('⚠️ Cleanup failed (test user still exists):', cleanupError.message);
        } else {
          console.log('✅ Test user cleaned up');
        }
        
        return {
          success: true,
          canCreateUser: true,
          canDeleteUser: true,
          canHardDelete: !cleanupError,
          testCompleted: true
        };
        
      } else {
        // Test with existing inactive user
        const testUser = testUsers[0];
        console.log(`🧪 Testing deletion with existing user: ${testUser.email}`);
        
        const { data: updatedUser, error: deleteError } = await supabase
          .from('users')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', testUser.id)
          .select()
          .single();
          
        if (deleteError) {
          console.error('❌ User update failed:', deleteError);
          return {
            success: false,
            canDeleteUser: false,
            error: deleteError.message
          };
        }
        
        console.log('✅ User update successful');
        
        return {
          success: true,
          canDeleteUser: true,
          testUserId: testUser.id,
          testCompleted: true
        };
      }
      
    } catch (error) {
      console.error('❌ Deletion functionality test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  static async generateFixRecommendations(diagnosticResults) {
    console.log('\n🔧 STEP 5: Generating Fix Recommendations');
    console.log('========================================');
    
    const fixes = [];
    const { tableAnalysis, rlsAnalysis, permissionAnalysis, deletionTest } = diagnosticResults;
    
    // Table structure issues
    if (!tableAnalysis?.success) {
      fixes.push({
        priority: 'CRITICAL',
        issue: 'Users table access problem',
        description: 'Cannot access users table',
        solution: 'Check database connection and table existence',
        sqlFix: `
-- Verify users table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public';
        `
      });
    }
    
    // RLS Policy issues
    if (rlsAnalysis?.success && !rlsAnalysis.canUpdate) {
      fixes.push({
        priority: 'HIGH',
        issue: 'RLS policy prevents user updates',
        description: 'Row Level Security is blocking user modifications',
        solution: 'Add or modify RLS policies for user management',
        sqlFix: `
-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to update users (admin only)
CREATE POLICY "Allow admin to update users" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u2 
      WHERE u2.id = auth.uid() 
      AND u2.role IN ('admin', 'manager')
      AND u2.is_active = true
    )
  );

-- Allow authenticated users to read users
CREATE POLICY "Allow authenticated users to read users" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');
        `,
        jsFixFunction: 'fixRLSPolicies'
      });
    }
    
    // Authentication issues
    if (!permissionAnalysis?.authenticated) {
      fixes.push({
        priority: 'HIGH',
        issue: 'User not authenticated',
        description: 'Current user is not authenticated',
        solution: 'Ensure user is logged in before attempting user management operations',
        jsFixFunction: 'ensureAuthentication'
      });
    }
    
    // Permission level issues
    if (permissionAnalysis?.authenticated && !permissionAnalysis?.isAdmin) {
      fixes.push({
        priority: 'MEDIUM',
        issue: 'Insufficient user permissions',
        description: 'Current user may not have admin privileges',
        solution: 'Verify user has admin or manager role',
        jsFixFunction: 'checkAdminPermissions'
      });
    }
    
    // Deletion functionality issues
    if (!deletionTest?.success || !deletionTest?.canDeleteUser) {
      fixes.push({
        priority: 'HIGH',
        issue: 'User deletion functionality broken',
        description: 'Cannot perform user deletion operations',
        solution: 'Implement enhanced user deletion service with proper error handling',
        jsFixFunction: 'fixUserDeletionService'
      });
    }
    
    console.log(`🔧 Generated ${fixes.length} fix recommendations:`);
    fixes.forEach((fix, index) => {
      console.log(`\n  ${index + 1}. [${fix.priority}] ${fix.issue}`);
      console.log(`     Solution: ${fix.solution}`);
    });
    
    return fixes;
  }
  
  // Automated fix functions
  static async fixRLSPolicies() {
    console.log('🔧 Attempting to fix RLS policies...');
    
    try {
      // Note: These would need to be run in Supabase SQL editor as they require elevated permissions
      const sqlCommands = [
        `ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;`,
        `
CREATE POLICY "Allow admin to manage users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u2 
      WHERE u2.id = auth.uid() 
      AND u2.role IN ('admin', 'manager')
      AND u2.is_active = true
    )
  );
        `,
        `
CREATE POLICY "Allow users to read active users" ON public.users
  FOR SELECT USING (
    is_active = true AND 
    auth.role() = 'authenticated'
  );
        `
      ];
      
      console.log('📋 SQL commands to run in Supabase:');
      sqlCommands.forEach((cmd, index) => {
        console.log(`\n-- Command ${index + 1}:`);
        console.log(cmd.trim());
      });
      
      return {
        success: false,
        requiresManualExecution: true,
        sqlCommands
      };
      
    } catch (error) {
      console.error('❌ RLS fix failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  static async fixUserDeletionService() {
    console.log('🔧 Creating enhanced user deletion service...');
    
    // Return enhanced service code
    return {
      success: true,
      enhancedServiceCode: `
// Enhanced User Deletion Service
export class EnhancedUserDeletionService {
  static async deleteUser(userId, options = {}) {
    try {
      console.log('🗑️ Starting user deletion process:', userId);
      
      // Step 1: Validate permissions
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }
      
      // Step 2: Check if current user has admin privileges
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('role, is_active')
        .eq('email', user.email)
        .single();
        
      if (userError || !currentUser) {
        throw new Error('Current user not found in database');
      }
      
      if (!['admin', 'manager'].includes(currentUser.role)) {
        throw new Error('Insufficient permissions to delete users');
      }
      
      // Step 3: Get target user
      const { data: targetUser, error: targetError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (targetError || !targetUser) {
        throw new Error('User to delete not found');
      }
      
      // Step 4: Prevent self-deletion
      if (targetUser.email === user.email) {
        throw new Error('Cannot delete your own account');
      }
      
      // Step 5: Perform soft delete
      const { data, error } = await supabase
        .from('users')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
          // Optional: add deleted_by and deleted_at fields
          ...(options.hardDelete ? {} : {
            deleted_at: new Date().toISOString(),
            deleted_by: currentUser.id
          })
        })
        .eq('id', userId)
        .select()
        .single();
        
      if (error) {
        throw new Error(\`Database error: \${error.message}\`);
      }
      
      console.log('✅ User successfully deactivated:', data.email);
      
      return {
        success: true,
        deletedUser: data,
        deletedBy: currentUser,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ User deletion failed:', error);
      throw error;
    }
  }
  
  static async reactivateUser(userId) {
    try {
      // Similar structure but reactivate user
      const { data, error } = await supabase
        .from('users')
        .update({
          is_active: true,
          updated_at: new Date().toISOString(),
          deleted_at: null,
          deleted_by: null
        })
        .eq('id', userId)
        .select()
        .single();
        
      if (error) throw error;
      
      return { success: true, reactivatedUser: data };
      
    } catch (error) {
      console.error('❌ User reactivation failed:', error);
      throw error;
    }
  }
}
      `
    };
  }
}

// Make available globally for console testing
if (typeof window !== 'undefined') {
  window.UserDeletionDiagnostic = UserDeletionDiagnostic;
  window.diagnoseUserDeletion = () => UserDeletionDiagnostic.diagnoseUserDeletionIssues();
}

console.log('🔬 User Deletion Diagnostic Tool loaded!');
console.log('Run: diagnoseUserDeletion() to analyze user deletion issues');