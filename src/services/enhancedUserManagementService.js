/**
 * Enhanced User Management Service
 * Professional-grade user deletion with comprehensive error handling
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class EnhancedUserManagementService {
  
  /**
   * Enhanced user deletion with proper error handling and validation
   * @param {string} userId - User ID to delete
   * @param {Object} options - Deletion options
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteUser(userId, options = {}) {
    console.log('🗑️ Enhanced user deletion process started:', { userId, options });
    
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
      
      console.log(`👤 Authenticated as: ${user.email}`);
      
      // Step 3: Get current user's permissions
      const { data: currentUser, error: currentUserError } = await supabase
        .from('users')
        .select('id, email, role, is_active, first_name, last_name')
        .eq('email', user.email)
        .single();
        
      if (currentUserError) {
        console.error('❌ Current user lookup failed:', currentUserError);
        throw new Error('Current user not found in database');
      }
      
      if (!currentUser.is_active) {
        throw new Error('Current user account is inactive');
      }
      
      // Step 4: Check permissions
      const adminRoles = ['admin', 'manager', 'super_admin'];
      if (!adminRoles.includes(currentUser.role)) {
        throw new Error('Insufficient permissions. Admin or Manager role required.');
      }
      
      console.log(`✅ Permission check passed: ${currentUser.role}`);
      
      // Step 5: Get target user
      const { data: targetUser, error: targetError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (targetError) {
        console.error('❌ Target user lookup failed:', targetError);
        
        if (targetError.code === 'PGRST116') {
          throw new Error('User not found');
        } else {
          throw new Error(`Database error: ${targetError.message}`);
        }
      }
      
      console.log(`🎯 Target user found: ${targetUser.email} (${targetUser.role})`);
      
      // Step 6: Business logic validations
      if (targetUser.id === currentUser.id) {
        throw new Error('Cannot delete your own account');
      }
      
      if (!targetUser.is_active && !options.forceDelete) {
        throw new Error('User is already inactive');
      }
      
      // Step 7: Role hierarchy check
      if (targetUser.role === 'admin' && currentUser.role !== 'super_admin') {
        throw new Error('Only super admin can delete admin users');
      }
      
      // Step 8: Check for dependencies (optional)
      if (options.checkDependencies) {
        const dependencyCheck = await this.checkUserDependencies(userId);
        if (!dependencyCheck.canDelete) {
          throw new Error(`Cannot delete user: ${dependencyCheck.reason}`);
        }
      }
      
      // Step 9: Perform the deletion
      console.log('🔄 Performing user deletion...');
      
      const updateData = {
        is_active: false,
        updated_at: new Date().toISOString()
      };
      
      // Add audit trail fields if they exist in the schema
      if (options.addAuditTrail !== false) {
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
        console.error('❌ Database deletion failed:', deleteError);
        
        // Provide specific error messages based on error codes
        if (deleteError.code === 'RLS_VIOLATION' || deleteError.message.includes('permission')) {
          throw new Error('Permission denied. Check Row Level Security policies.');
        } else if (deleteError.code === 'FOREIGN_KEY_VIOLATION') {
          throw new Error('Cannot delete user: related records exist. Use force delete or remove dependencies first.');
        } else {
          throw new Error(`Database error: ${deleteError.message}`);
        }
      }
      
      console.log('✅ User successfully deactivated:', deletedUser.email);
      
      // Step 10: Create audit log entry (optional)
      if (options.createAuditLog !== false) {
        try {
          await this.createAuditLogEntry({
            action: 'USER_DELETED',
            performedBy: currentUser.id,
            targetUserId: userId,
            targetUserEmail: targetUser.email,
            reason: options.reason,
            timestamp: new Date().toISOString()
          });
        } catch (auditError) {
          console.warn('⚠️ Audit log creation failed:', auditError.message);
          // Don't fail the deletion for audit log issues
        }
      }
      
      // Step 11: Invalidate user sessions (optional)
      if (options.invalidateSessions !== false) {
        try {
          await this.invalidateUserSessions(userId);
        } catch (sessionError) {
          console.warn('⚠️ Session invalidation failed:', sessionError.message);
          // Don't fail the deletion for session issues
        }
      }
      
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
        timestamp: new Date().toISOString(),
        method: 'soft_delete'
      };
      
    } catch (error) {
      console.error('❌ Enhanced user deletion failed:', error);
      
      // Return structured error response
      return {
        success: false,
        error: error.message,
        errorType: error.name || 'UserDeletionError',
        timestamp: new Date().toISOString(),
        userId
      };
    }
  }
  
  /**
   * Reactivate a previously deleted user
   * @param {string} userId - User ID to reactivate
   * @param {Object} options - Reactivation options
   * @returns {Promise<Object>} Reactivation result
   */
  static async reactivateUser(userId, options = {}) {
    console.log('🔄 User reactivation process started:', userId);
    
    try {
      // Similar validation as delete
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }
      
      const { data: currentUser, error: currentUserError } = await supabase
        .from('users')
        .select('id, email, role, is_active')
        .eq('email', user.email)
        .single();
        
      if (currentUserError || !['admin', 'manager', 'super_admin'].includes(currentUser.role)) {
        throw new Error('Insufficient permissions');
      }
      
      const { data: reactivatedUser, error: reactivateError } = await supabase
        .from('users')
        .update({
          is_active: true,
          updated_at: new Date().toISOString(),
          deleted_at: null,
          deleted_by: null,
          reactivated_at: new Date().toISOString(),
          reactivated_by: currentUser.id
        })
        .eq('id', userId)
        .select()
        .single();
        
      if (reactivateError) {
        throw new Error(`Reactivation failed: ${reactivateError.message}`);
      }
      
      console.log('✅ User successfully reactivated:', reactivatedUser.email);
      
      return {
        success: true,
        reactivatedUser,
        reactivatedBy: currentUser,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ User reactivation failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Check if user has dependencies that prevent deletion
   * @param {string} userId - User ID to check
   * @returns {Promise<Object>} Dependency check result
   */
  static async checkUserDependencies(userId) {
    try {
      const dependencies = [];
      
      // Check for sales created by this user
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
        
      if (!salesError && sales && sales.length > 0) {
        dependencies.push('sales');
      }
      
      // Check for other dependencies (add as needed)
      // - stock_movements
      // - audit_logs
      // - etc.
      
      return {
        canDelete: dependencies.length === 0,
        dependencies,
        reason: dependencies.length > 0 
          ? `User has related records in: ${dependencies.join(', ')}`
          : null
      };
      
    } catch (error) {
      console.warn('⚠️ Dependency check failed:', error);
      return {
        canDelete: true, // Allow deletion if check fails
        error: error.message
      };
    }
  }
  
  /**
   * Create audit log entry for user management actions
   * @param {Object} auditData - Audit data
   * @returns {Promise<void>}
   */
  static async createAuditLogEntry(auditData) {
    try {
      const { error } = await supabase
        .from('audit_log')
        .insert({
          table_name: 'users',
          operation: auditData.action,
          record_id: auditData.targetUserId,
          user_id: auditData.performedBy,
          timestamp: auditData.timestamp,
          new_values: {
            action: auditData.action,
            target_user_email: auditData.targetUserEmail,
            reason: auditData.reason
          }
        });
        
      if (error) {
        console.warn('⚠️ Audit log creation failed:', error);
      } else {
        console.log('✅ Audit log entry created');
      }
    } catch (error) {
      console.warn('⚠️ Audit log error:', error);
    }
  }
  
  /**
   * Invalidate all sessions for a user
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  static async invalidateUserSessions(userId) {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString()
        })
        .eq('user_id', userId);
        
      if (error) {
        console.warn('⚠️ Session invalidation failed:', error);
      } else {
        console.log('✅ User sessions invalidated');
      }
    } catch (error) {
      console.warn('⚠️ Session invalidation error:', error);
    }
  }
  
  /**
   * Get detailed user information for management operations
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User details
   */
  static async getUserDetails(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          sales(count),
          stock_movements(count)
        `)
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      
      return { success: true, user: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Bulk user management operations
   * @param {Array} userIds - Array of user IDs
   * @param {string} operation - Operation to perform
   * @param {Object} options - Operation options
   * @returns {Promise<Object>} Bulk operation result
   */
  static async bulkUserOperation(userIds, operation, options = {}) {
    console.log(`🔄 Bulk ${operation} operation started:`, userIds);
    
    const results = {
      successful: [],
      failed: [],
      total: userIds.length
    };
    
    for (const userId of userIds) {
      try {
        let result;
        
        switch (operation) {
          case 'delete':
            result = await this.deleteUser(userId, options);
            break;
          case 'reactivate':
            result = await this.reactivateUser(userId, options);
            break;
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
        
        if (result.success) {
          results.successful.push({ userId, result });
        } else {
          results.failed.push({ userId, error: result.error });
        }
        
      } catch (error) {
        results.failed.push({ userId, error: error.message });
      }
    }
    
    console.log(`✅ Bulk operation completed: ${results.successful.length} successful, ${results.failed.length} failed`);
    
    return results;
  }
}

// Export for use in other modules
export default EnhancedUserManagementService;

// Make available globally for testing
if (typeof window !== 'undefined') {
  window.EnhancedUserManagementService = EnhancedUserManagementService;
  
  // Convenience functions for console testing
  window.testUserDeletion = async (userId) => {
    console.log('🧪 Testing user deletion:', userId);
    const result = await EnhancedUserManagementService.deleteUser(userId, {
      reason: 'Test deletion',
      checkDependencies: true
    });
    console.log('🧪 Test result:', result);
    return result;
  };
  
  window.testUserReactivation = async (userId) => {
    console.log('🧪 Testing user reactivation:', userId);
    const result = await EnhancedUserManagementService.reactivateUser(userId);
    console.log('🧪 Test result:', result);
    return result;
  };
}

console.log('🔧 Enhanced User Management Service loaded!');
console.log('Available functions:');
console.log('  • testUserDeletion(userId)');
console.log('  • testUserReactivation(userId)');
console.log('  • EnhancedUserManagementService.deleteUser()');
console.log('  • EnhancedUserManagementService.reactivateUser()');