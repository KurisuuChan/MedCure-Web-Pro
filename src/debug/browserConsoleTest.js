// 🧪 BROWSER CONSOLE TEST - User Deletion Debug
// Copy this into your browser console (F12) while logged into your app

console.log('🔍 Starting user deletion debug...');

async function debugUserDeletion() {
  try {
    // Step 1: Check if we're authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('👤 Auth Status:', { user: user?.email, error: authError });
    
    if (!user) {
      console.error('❌ Not authenticated - please log in first');
      return;
    }

    // Step 2: Test basic table access
    console.log('🔍 Testing basic table access...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, is_active')
      .limit(3);
    
    console.log('📊 Users query result:', { data: usersData, error: usersError });
    
    if (usersError) {
      console.error('❌ Cannot read users table:', usersError);
      if (usersError.message.includes('permission')) {
        console.log('💡 Solution: RLS policies are blocking access');
      }
      return;
    }

    // Step 3: Check current user in database
    const { data: currentUserData, error: currentUserError } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single();
    
    console.log('👤 Current user in DB:', { data: currentUserData, error: currentUserError });

    // Step 4: Test update permission (harmless test)
    if (currentUserData) {
      console.log('🧪 Testing update permissions...');
      const { data: updateTest, error: updateError } = await supabase
        .from('users')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentUserData.id)
        .select();
      
      console.log('📝 Update test result:', { data: updateTest, error: updateError });
      
      if (updateError) {
        console.error('❌ Cannot update users table:', updateError);
        if (updateError.message.includes('permission') || updateError.code === '42501') {
          console.log('💡 Solution: RLS policies are blocking updates');
          console.log('💡 Try this in Supabase SQL: ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;');
        }
      } else {
        console.log('✅ Update permissions work - the issue might be elsewhere');
      }
    }

    // Step 5: Try the actual delete operation
    if (usersData && usersData.length > 1) {
      const testUserId = usersData.find(u => u.email !== user.email)?.id;
      if (testUserId) {
        console.log('🗑️ Testing soft delete...');
        const { data: deleteTest, error: deleteError } = await supabase
          .from('users')
          .update({ is_active: false })
          .eq('id', testUserId)
          .select();
        
        console.log('🗑️ Delete test result:', { data: deleteTest, error: deleteError });
        
        if (deleteError) {
          console.error('❌ Delete failed:', deleteError);
          console.log('💡 Error code:', deleteError.code);
          console.log('💡 Error message:', deleteError.message);
        } else {
          console.log('✅ Delete works! The issue might be in your component');
          
          // Revert the test
          await supabase
            .from('users')
            .update({ is_active: true })
            .eq('id', testUserId);
          console.log('↩️ Reverted test deletion');
        }
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugUserDeletion();

console.log('');
console.log('💡 If you see RLS/permission errors above:');
console.log('   1. Go to Supabase SQL Editor');
console.log('   2. Run: ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;');
console.log('   3. Test user deletion again');
console.log('   4. If it works, the issue is RLS policies');