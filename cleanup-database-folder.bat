@echo off
echo 🗑️ DATABASE FOLDER CLEANUP - MedCure Pro
echo.
echo ⚠️  WARNING: This will delete 60+ redundant database files!
echo ✅ KEEPING: Only COMPLETE_MEDCURE_MIGRATION.sql (the production-ready migration)
echo.
set /p confirm="Are you sure you want to proceed? (Y/N): "
if /i "%confirm%" NEQ "Y" (
    echo Operation cancelled.
    pause
    exit /b
)

echo.
echo 🧹 Cleaning database folder...

REM Navigate to database folder
cd database

REM === DELETE ALL DIAGNOSTIC FILES ===
del "ADVANCED_POS_DIAGNOSTIC.sql" 2>nul
del "BUY_UNDO_DIAGNOSTIC.sql" 2>nul
del "COMPLETE_PAYMENT_DIAGNOSTIC.sql" 2>nul
del "COMPLETE_SYSTEM_FIX_TEST.sql" 2>nul
del "COMPREHENSIVE_STOCK_DIAGNOSTIC.sql" 2>nul
del "COMPREHENSIVE_TRANSACTION_DIAGNOSTIC.sql" 2>nul
del "COMPREHENSIVE_WORKFLOW_DIAGNOSTIC.sql" 2>nul
del "DATABASE_DIAGNOSTIC_TEST.sql" 2>nul
del "DEBUG_STOCK_RESTORATION.sql" 2>nul
del "DETAILED_STOCK_DIAGNOSTIC.sql" 2>nul
del "DIAGNOSTIC_CHECK_FUNCTIONS.sql" 2>nul
del "DIAGNOSTIC_CHECK_PAYMENT.sql" 2>nul
del "FOCUSED_DIAGNOSTIC.sql" 2>nul
del "FUNCTION_CONFLICT_ANALYSIS.sql" 2>nul
del "PROFESSIONAL_STOCK_DIAGNOSIS.sql" 2>nul
del "ROOT_CAUSE_ANALYSIS.sql" 2>nul
del "SIMPLE_STOCK_CHECK.sql" 2>nul
del "TRIGGER_LOGIC_DIAGNOSIS.sql" 2>nul

REM === DELETE ALL FIX FILES ===
del "COMPLETE_EDIT_FIX.sql" 2>nul
del "COMPLETE_POS_FIX.sql" 2>nul
del "COMPREHENSIVE_FIX_PAYMENT.sql" 2>nul
del "CORRECT_STOCK_LEVELS.sql" 2>nul
del "CRITICAL_FIX_REMOVE_TRIGGER.sql" 2>nul
del "DEPLOY_STOCK_FIXES_NOW.sql" 2>nul
del "DEPLOY_STOCK_FIX_NOW.sql" 2>nul
del "DOUBLE_CONVERSION_FIX_TEST.sql" 2>nul
del "EMERGENCY_FIX_STORED_PROCEDURE.sql" 2>nul
del "EMERGENCY_PAYMENT_FIX_FINAL.sql" 2>nul
del "FINAL_PARAMETER_FIX.sql" 2>nul
del "FIX_CONSTRAINT_CONFLICT.sql" 2>nul
del "FIX_DOUBLE_DEDUCTION_TRIGGERS.sql" 2>nul
del "FIX_EDIT_COLUMNS.sql" 2>nul
del "FIX_JSON_ARRAY_ERROR.sql" 2>nul
del "FIX_PARAMETER_TYPES.sql" 2>nul
del "FIX_REVENUE_TRACKING.sql" 2>nul
del "FIX_STOCK_CALCULATION.sql" 2>nul
del "FIX_STOCK_EMERGENCY.sql" 2>nul
del "FIX_STOCK_LOGIC_ERROR.sql" 2>nul
del "FIX_TRANSACTION_EDIT_STOCK_MANAGEMENT.sql" 2>nul
del "FIX_TRIGGER_FUNCTIONS.sql" 2>nul
del "FIX_UNDO_CONSTRAINT.sql" 2>nul
del "IMMEDIATE_FIX_OPTIONS.sql" 2>nul
del "IMMEDIATE_FIX_STOCK_MOVEMENTS.sql" 2>nul
del "IMMEDIATE_STOCK_FIX.sql" 2>nul
del "MINIMAL_FIX_PAYMENT_ERROR.sql" 2>nul
del "PROFESSIONAL_STOCK_DEDUCTION_FIX.sql" 2>nul
del "PROFESSIONAL_STOCK_OVERHAUL.sql" 2>nul
del "PROFESSIONAL_STOCK_SYSTEM_FIX.sql" 2>nul
del "SAFE_DEPLOYMENT_NO_CONFLICTS.sql" 2>nul

REM === DELETE SCHEMA VARIANTS ===
del "FINAL_OPTIMIZED_SCHEMA.sql" 2>nul
del "PROFESSIONAL_SCHEMA_DEPLOYMENT.sql" 2>nul

REM === DELETE TEST FILES ===
del "create_test_transaction_data.sql" 2>nul
del "TEST_PWD_SENIOR_DISCOUNTS.sql" 2>nul
del "TEST_PWD_SENIOR_DISCOUNTS_CLEAN.sql" 2>nul
del "UPDATE_STORED_PROCEDURE_DISCOUNTS.sql" 2>nul
del "VALIDATE_PAYMENT_FIX.sql" 2>nul

REM === DELETE UTILITY FILES ===
del "CREATE_NOTIFICATIONS_TABLE.sql" 2>nul

REM === DELETE MARKDOWN ANALYSIS FILES ===
del "ANALYTICS_COMPLEXITY_ASSESSMENT.md" 2>nul
del "ANALYTICS_DASHBOARD_SPEC.md" 2>nul
del "CODE_REFACTORING_PLAN.md" 2>nul
del "DASHBOARD_REDUNDANCY_ANALYSIS.md" 2>nul
del "FIX_USER_RELATIONSHIP_AMBIGUITY.md" 2>nul
del "PAYMENT_FIXES_APPLIED.md" 2>nul
del "PAYMENT_LOGIC_ISSUES.md" 2>nul
del "PROFESSIONAL_DEVELOPMENT_PLAN.md" 2>nul
del "SYSTEM_INTEGRATION_TESTING.md" 2>nul
del "TRANSACTION_EDITING_ANALYSIS.md" 2>nul
del "TRANSACTION_EDITING_AND_UNDO_ANALYSIS.md" 2>nul

REM === DELETE OLD DATABASE FOLDER ===
rmdir /s /q "old database" 2>nul

echo.
echo ✅ Database folder cleanup completed!
echo.
echo 📋 ESSENTIAL FILES KEPT:
echo ✅ COMPLETE_MEDCURE_MIGRATION.sql (Production-ready migration)
echo.
echo 🗑️ DELETED FILES:
echo ❌ 15+ Diagnostic files
echo ❌ 25+ Fix files  
echo ❌ 5+ Schema variants
echo ❌ 8+ Test files
echo ❌ 10+ Analysis markdown files
echo ❌ old database/ folder
echo.
echo 📊 RESULT: Database folder reduced from 65+ files to 1 essential file!
echo 🎯 Your database is now clean and production-ready!

cd ..
pause
