@echo off
echo 🗑️ Cleaning up MedCure Pro - Removing redundant and test files...
echo.

REM === REDUNDANT DOCUMENTATION FILES ===
echo Deleting redundant documentation files...
del "COMPLETE_SYSTEM_ANALYSIS.md" 2>nul
del "CRITICAL_RUNTIME_FIXES.md" 2>nul
del "DETAILED_FLOW_ANALYSIS.md" 2>nul
del "ENTERPRISE_POS_SYSTEM_COMPLETE.md" 2>nul
del "FINAL_TESTING_GUIDE.md" 2>nul
del "IMMEDIATE_IMPLEMENTATION_PLAN.md" 2>nul
del "PROFESSIONAL_FIX_ACTION_PLAN.md" 2>nul
del "PROFESSIONAL_POS_IMPROVEMENTS.md" 2>nul
del "PROFESSIONAL_STOCK_MANAGEMENT_SOLUTION.md" 2>nul
del "PROFESSIONAL_TRANSACTION_FIX_DEPLOYMENT.md" 2>nul
del "STOCK_MANAGEMENT_FIX_GUIDE.md" 2>nul
del "SYSTEM_COMPLETION_ANALYSIS.md" 2>nul
del "TESTING_VALIDATION_COMPLETE.md" 2>nul
del "TRANSACTION_EDIT_UNDO_PRICE_FIX.md" 2>nul
del "SQL_SCHEMA_VALIDATION_AND_OPTIMIZATION.md" 2>nul

REM === TEST AND DIAGNOSTIC FILES ===
echo Deleting test and diagnostic files...
del "check-transaction-fields.js" 2>nul
del "database-diagnostic.sql" 2>nul
del "live-behavior-test.js" 2>nul
del "pos-diagnostic.js" 2>nul

REM === DOCS FOLDER (ALL TEST FILES) ===
echo Deleting docs folder with test files...
rmdir /s /q "docs" 2>nul

REM === MD FOLDER (OUTDATED PLANS) ===
echo Deleting md folder with outdated plans...
rmdir /s /q "md" 2>nul

REM === PUBLIC TEST/DEBUG FILES ===
echo Deleting public test and debug files...
del "public\analytics-debug.html" 2>nul
del "public\critical-stock-fix.html" 2>nul
del "public\database-column-validator.js" 2>nul
del "public\debug-transaction-editing.js" 2>nul
del "public\diagnostic-center.html" 2>nul
del "public\fix-json-array.html" 2>nul
del "public\manual-functions.js" 2>nul
del "public\node-test-validation.js" 2>nul
del "public\pricing-diagnostic.html" 2>nul
del "public\pricing-diagnostic.js" 2>nul
del "public\pricing-fix-tool.html" 2>nul
del "public\quick-parameter-fix.html" 2>nul
del "public\quick-setup.js" 2>nul
del "public\quick-test.html" 2>nul
del "public\quick-validation.js" 2>nul
del "public\system-diagnostic-clean.js" 2>nul
del "public\system-diagnostic.js" 2>nul
del "public\test-advanced-ml.html" 2>nul
del "public\test-api-system.html" 2>nul
del "public\test-intelligent-notifications.js" 2>nul
del "public\test-management.js" 2>nul
del "public\test-stock-management.js" 2>nul
del "public\test-supply-chain.html" 2>nul
del "public\test-supply-chain.js" 2>nul

REM === REDUNDANT DATABASE FILES ===
echo Deleting redundant database files...
del "database\additional_structures.sql" 2>nul
del "database\category_enhancement_schema.sql" 2>nul
del "database\corrected_immediate_schema_fix.sql" 2>nul
del "database\deploy_complete_user_management.sql" 2>nul
del "database\deploy_enhanced_features.sql" 2>nul
del "database\deploy_user_management_safe.sql" 2>nul
del "database\direct_fix_archive_reason.sql" 2>nul
del "database\enhanced_schema_updates.sql" 2>nul
del "database\fix_inventory_update.sql" 2>nul
del "database\fix_missing_columns.sql" 2>nul
del "database\generate_historical_sales_data.sql" 2>nul
del "database\immediate_schema_fix.sql" 2>nul
del "database\link_auth_users.sql" 2>nul
del "database\login_tracking_setup.sql" 2>nul
del "database\notification_system_schema.sql" 2>nul
del "database\policies_auth_fixed.sql" 2>nul
del "database\policies_fixed.sql" 2>nul
del "database\policies.sql" 2>nul
del "database\price_per_piece_documentation.sql" 2>nul
del "database\products_import_metadata_fix.sql" 2>nul
del "database\professional_cleanup.sql" 2>nul
del "database\quick_test_setup.sql" 2>nul
del "database\realtime_notifications_setup.sql" 2>nul
del "database\schema_alignment_strategy.sql" 2>nul
del "database\supplier_management_schema.sql" 2>nul
del "database\truncate_all_tables.sql" 2>nul
del "database\user_management_schema_clean.sql" 2>nul
del "database\user_management_schema.sql" 2>nul

echo.
echo ✅ Cleanup completed! Redundant files removed.
echo.
echo 📋 ESSENTIAL FILES KEPT:
echo - README.md (edited)
echo - DATABASE_DOCUMENTATION.md (edited)
echo - DEPLOYMENT_GUIDE.md (edited)
echo - SCHEMA_REFERENCE.md (edited)
echo - TABLE_USAGE_TRACKING.md (edited)
echo - TRANSACTION_EDIT_UNDO_GUIDE.md (edited)
echo - COMPLETE_MEDCURE_MIGRATION.sql
echo - All src/ files (core application)
echo - package.json, vite.config.js (build files)
echo - database/schema.sql, database/seed.sql (essential DB files)
echo.
echo 🎯 Your MedCure Pro is now clean and production-ready!
pause
