// ================================================================
// BROWSER-BASED RLS AND CONSTRAINT DIAGNOSTICS
// ================================================================
// Copy and paste this into your browser console while on the MedCure Pro application

async function runRLSDiagnostics() {
    console.log('🔍 Starting RLS and Constraint Diagnostics...');
    
    try {
        // Get Supabase client
        const supabase = window.supabase || (window.__supabase && window.__supabase.supabase);
        
        if (!supabase) {
            console.error('❌ Supabase client not found. Make sure you\'re on the MedCure Pro app.');
            return;
        }

        console.log('✅ Supabase client found');

        // Test 1: Check current user
        const { data: user, error: userError } = await supabase.auth.getUser();
        if (userError) {
            console.error('❌ User check failed:', userError);
            return;
        }
        console.log('👤 Current user:', user?.user?.email || 'Not authenticated');

        // Test 2: Try to read sales table
        console.log('\n📖 Testing sales table read access...');
        const { data: salesData, error: readError } = await supabase
            .from('sales')
            .select('id, total_amount, status, user_id')
            .limit(1);
        
        if (readError) {
            console.error('❌ Sales read error:', readError);
        } else {
            console.log('✅ Sales read successful. Sample record:', salesData[0]);
        }

        // Test 3: Try to update a sales record
        if (salesData && salesData.length > 0) {
            const testRecord = salesData[0];
            const originalTotal = testRecord.total_amount;
            const testTotal = parseFloat(originalTotal) + 0.01;
            
            console.log(`\n🔄 Testing update on transaction ${testRecord.id}`);
            console.log(`Original total: ${originalTotal}, Test total: ${testTotal}`);
            
            // Attempt update
            const { data: updateData, error: updateError } = await supabase
                .from('sales')
                .update({ 
                    total_amount: testTotal,
                    updated_at: new Date().toISOString()
                })
                .eq('id', testRecord.id)
                .select();
            
            if (updateError) {
                console.error('❌ Direct update failed:', updateError);
                console.log('📋 Error details:', {
                    code: updateError.code,
                    message: updateError.message,
                    details: updateError.details,
                    hint: updateError.hint
                });
            } else {
                console.log('✅ Direct update succeeded:', updateData);
                
                // Verify the update
                const { data: verifyData, error: verifyError } = await supabase
                    .from('sales')
                    .select('total_amount')
                    .eq('id', testRecord.id)
                    .single();
                
                if (verifyError) {
                    console.error('❌ Verification failed:', verifyError);
                } else {
                    const actualTotal = parseFloat(verifyData.total_amount);
                    if (Math.abs(actualTotal - testTotal) < 0.001) {
                        console.log('✅ Update verified successfully');
                        // Restore original value
                        await supabase
                            .from('sales')
                            .update({ total_amount: originalTotal })
                            .eq('id', testRecord.id);
                        console.log('↩️ Original value restored');
                    } else {
                        console.error(`❌ Update verification failed. Expected: ${testTotal}, Got: ${actualTotal}`);
                    }
                }
            }
        }

        // Test 4: Try RPC function
        console.log('\n🔧 Testing RPC function...');
        if (salesData && salesData.length > 0) {
            const testRecord = salesData[0];
            const testTotal = parseFloat(testRecord.total_amount) + 0.02;
            
            const { data: rpcData, error: rpcError } = await supabase.rpc('update_transaction_total', {
                transaction_id: testRecord.id,
                new_total: testTotal
            });
            
            if (rpcError) {
                console.error('❌ RPC function failed:', rpcError);
            } else {
                console.log('✅ RPC function succeeded:', rpcData);
                
                // Verify RPC update
                const { data: verifyRpcData, error: verifyRpcError } = await supabase
                    .from('sales')
                    .select('total_amount')
                    .eq('id', testRecord.id)
                    .single();
                
                if (verifyRpcError) {
                    console.error('❌ RPC verification failed:', verifyRpcError);
                } else {
                    const actualTotal = parseFloat(verifyRpcData.total_amount);
                    if (Math.abs(actualTotal - testTotal) < 0.001) {
                        console.log('✅ RPC update verified successfully');
                        // Restore original value
                        await supabase
                            .from('sales')
                            .update({ total_amount: testRecord.total_amount })
                            .eq('id', testRecord.id);
                    } else {
                        console.error(`❌ RPC verification failed. Expected: ${testTotal}, Got: ${actualTotal}`);
                    }
                }
            }
        }

        // Test 5: Check diagnostic RPC
        console.log('\n🔍 Running diagnostic RPC...');
        const { data: diagData, error: diagError } = await supabase.rpc('diagnose_transaction_update', {
            transaction_id: salesData && salesData.length > 0 ? salesData[0].id : null
        });
        
        if (diagError) {
            console.error('❌ Diagnostic RPC failed:', diagError);
        } else {
            console.log('📊 Diagnostic results:', diagData);
        }

        // Test 6: Try to access system tables (this will likely fail due to RLS)
        console.log('\n🔐 Testing RLS policy access...');
        try {
            const { data: policyData, error: policyError } = await supabase
                .from('pg_policies')
                .select('*')
                .eq('tablename', 'sales');
            
            if (policyError) {
                console.log('❌ Cannot access pg_policies (expected):', policyError.message);
            } else {
                console.log('📜 RLS policies found:', policyData);
            }
        } catch (e) {
            console.log('❌ System table access blocked (expected)');
        }

        console.log('\n📋 SUMMARY:');
        console.log('1. Check the console output above for specific errors');
        console.log('2. If direct updates fail but RPC succeeds, it\'s an RLS policy issue');
        console.log('3. If both fail with the same error, it\'s likely a constraint or trigger issue');
        console.log('4. If updates succeed but don\'t persist, check for conflicting triggers');
        
        console.log('\n🔧 NEXT STEPS:');
        console.log('1. Run the SQL diagnostics in Supabase dashboard');
        console.log('2. Check the specific error codes and messages above');
        console.log('3. Look for patterns in when updates succeed vs fail');

    } catch (error) {
        console.error('❌ Diagnostic script failed:', error);
    }
}

// Auto-run the diagnostics
console.log('🚀 RLS and Constraint Diagnostics loaded. Running automatically...');
runRLSDiagnostics();

// Make function available for manual re-run
window.runRLSDiagnostics = runRLSDiagnostics;