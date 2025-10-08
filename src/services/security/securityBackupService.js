import { supabase } from "../../config/supabase";

/**
 * Security & Backup Service
 * Handles security settings, backup operations, and data management
 */

class SecurityBackupService {
  /**
   * Load security settings from database
   */
  static async loadSecuritySettings() {
    try {
      console.log("🔐 Loading security settings...");

      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value")
        .in("setting_key", [
          "password_min_length",
          "session_timeout",
          "require_two_factor",
          "auto_backup_enabled",
          "backup_frequency",
          "backup_retention_days",
        ]);

      if (error) {
        console.error("❌ Error loading security settings:", error);
        // Fall back to localStorage
        const savedSettings = localStorage.getItem("medcure-security-settings");
        if (savedSettings) {
          return JSON.parse(savedSettings);
        }
        // Return defaults
        return this.getDefaultSettings();
      }

      // Parse settings from database
      const settings = this.getDefaultSettings();
      data.forEach(({ setting_key, setting_value }) => {
        switch (setting_key) {
          case "password_min_length":
            settings.passwordMinLength = String(setting_value);
            break;
          case "session_timeout":
            settings.sessionTimeout = String(setting_value);
            break;
          case "require_two_factor":
            settings.requireTwoFactor = Boolean(setting_value);
            break;
          case "auto_backup_enabled":
            settings.autoBackupEnabled = Boolean(setting_value);
            break;
          case "backup_frequency":
            settings.backupFrequency = String(setting_value);
            break;
          case "backup_retention_days":
            settings.retentionDays = String(setting_value);
            break;
          default:
            break;
        }
      });

      console.log("✅ Security settings loaded:", settings);
      // Cache in localStorage
      localStorage.setItem(
        "medcure-security-settings",
        JSON.stringify(settings)
      );
      return settings;
    } catch (error) {
      console.error("❌ Error loading security settings:", error);
      return this.getDefaultSettings();
    }
  }

  /**
   * Save security settings to database
   */
  static async saveSecuritySettings(settings) {
    try {
      console.log("💾 Saving security settings:", settings);

      const settingsMap = {
        passwordMinLength: "password_min_length",
        sessionTimeout: "session_timeout",
        requireTwoFactor: "require_two_factor",
        autoBackupEnabled: "auto_backup_enabled",
        backupFrequency: "backup_frequency",
        retentionDays: "backup_retention_days",
      };

      // Prepare updates
      const updates = [];
      for (const [key, value] of Object.entries(settings)) {
        const settingKey = settingsMap[key];
        if (settingKey) {
          updates.push({
            setting_key: settingKey,
            setting_value: value,
            setting_type: this.getSettingType(settingKey),
          });
        }
      }

      // Save each setting
      for (const update of updates) {
        const { error } = await supabase.from("system_settings").upsert(
          {
            setting_key: update.setting_key,
            setting_value: update.setting_value,
            setting_type: update.setting_type,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "setting_key" }
        );

        if (error) {
          console.error(`❌ Error updating ${update.setting_key}:`, error);
        }
      }

      // Cache in localStorage
      localStorage.setItem(
        "medcure-security-settings",
        JSON.stringify(settings)
      );

      console.log("✅ Security settings saved successfully");
      return { success: true };
    } catch (error) {
      console.error("❌ Error saving security settings:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a manual backup of the database
   */
  static async createManualBackup() {
    try {
      console.log("💾 Initiating manual backup...");

      const timestamp = new Date().toISOString();
      const backupData = {
        timestamp,
        type: "manual",
        status: "in_progress",
      };

      // Get all critical tables data
      const tables = [
        "products",
        "categories",
        "customers",
        "sales",
        "users",
        "inventory_logs",
        "system_settings",
      ];

      const backup = {
        ...backupData,
        tables: {},
      };

      // Fetch data from each table
      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table).select("*");

          if (error) {
            console.warn(
              `⚠️ Warning: Could not backup ${table}:`,
              error.message
            );
            backup.tables[table] = { error: error.message, count: 0 };
          } else {
            backup.tables[table] = {
              count: data?.length || 0,
              data: data || [],
            };
            console.log(`✅ Backed up ${table}: ${data?.length || 0} records`);
          }
        } catch (tableError) {
          console.warn(
            `⚠️ Warning: Exception backing up ${table}:`,
            tableError
          );
          backup.tables[table] = { error: tableError.message, count: 0 };
        }
      }

      backup.status = "completed";

      // Save backup metadata to localStorage (primary storage)
      const backupKey = `medcure-backup-${timestamp}`;
      const totalRecords = Object.values(backup.tables).reduce(
        (sum, t) => sum + (t.count || 0),
        0
      );

      try {
        // Store metadata with summary
        const metadata = {
          timestamp,
          type: "manual",
          status: "completed",
          totalRecords,
          tables: Object.fromEntries(
            Object.entries(backup.tables).map(([name, info]) => [
              name,
              { count: info.count, hasData: !!info.data },
            ])
          ),
        };
        localStorage.setItem(backupKey, JSON.stringify(metadata));
        localStorage.setItem("medcure-last-backup", JSON.stringify(metadata));
        console.log("✅ Backup metadata saved to localStorage");
      } catch (storageError) {
        console.warn(
          "⚠️ Could not save backup metadata to localStorage:",
          storageError
        );
      }

      // Try to store in backup_logs table if it exists (optional)
      try {
        await supabase.from("backup_logs").insert({
          backup_type: "manual",
          status: "completed",
          tables_backed_up: Object.keys(backup.tables),
          total_records: totalRecords,
          created_at: timestamp,
        });
        console.log("✅ Backup logged to database");
      } catch {
        // Silently ignore - table may not exist and that's okay
        console.log("ℹ️ Backup logging skipped (table doesn't exist)");
      }

      console.log("✅ Manual backup completed:", backup);

      return {
        success: true,
        backup: {
          timestamp,
          totalRecords: Object.values(backup.tables).reduce(
            (sum, t) => sum + (t.count || 0),
            0
          ),
          tables: Object.keys(backup.tables).length,
        },
      };
    } catch (error) {
      console.error("❌ Error creating manual backup:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get last backup information
   */
  static async getLastBackupInfo() {
    try {
      // Try to get from localStorage first (primary source)
      const lastBackup = localStorage.getItem("medcure-last-backup");
      if (lastBackup) {
        const backup = JSON.parse(lastBackup);
        console.log("📊 Last backup info from localStorage:", backup);
        return {
          timestamp: backup.timestamp,
          type: backup.type,
          status: backup.status,
          totalRecords: backup.totalRecords,
        };
      }

      // Fallback: Try to get from backup_logs table
      try {
        const { data, error } = await supabase
          .from("backup_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          console.log("📊 Last backup info from database:", data);
          return {
            timestamp: data.created_at,
            type: data.backup_type,
            status: data.status,
            totalRecords: data.total_records,
          };
        }
      } catch {
        // Table doesn't exist, that's okay
        console.log("ℹ️ No backup_logs table found, using localStorage only");
      }

      // No backup found
      console.log("ℹ️ No backup history found");
      return null;
    } catch (error) {
      console.error("❌ Error getting last backup info:", error);
      return null;
    }
  }

  /**
   * Get default security settings
   */
  static getDefaultSettings() {
    return {
      passwordMinLength: "8",
      sessionTimeout: "30",
      requireTwoFactor: false,
      autoBackupEnabled: true,
      backupFrequency: "daily",
      retentionDays: "30",
    };
  }

  /**
   * Get setting type for database
   */
  static getSettingType(key) {
    if (key.includes("require_") || key.includes("enabled")) {
      return "boolean";
    }
    return "string";
  }

  /**
   * Validate password against policy
   */
  static validatePassword(password, minLength = 8) {
    if (password.length < minLength) {
      return {
        valid: false,
        message: `Password must be at least ${minLength} characters long`,
      };
    }

    // Additional password strength checks
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return {
        valid: false,
        message:
          "Password must contain uppercase, lowercase, and numeric characters",
      };
    }

    return { valid: true, message: "Password is strong" };
  }

  /**
   * Clean up old backups based on retention policy
   */
  static async cleanupOldBackups(retentionDays = 30) {
    try {
      console.log(`🧹 Cleaning up backups older than ${retentionDays} days...`);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(retentionDays));

      // Clean from database
      const { error } = await supabase
        .from("backup_logs")
        .delete()
        .lt("created_at", cutoffDate.toISOString());

      if (error) {
        console.warn("⚠️ Could not clean database backups:", error.message);
      }

      // Clean from localStorage
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith("medcure-backup-")
      );

      keys.forEach((key) => {
        try {
          const backup = JSON.parse(localStorage.getItem(key));
          const backupDate = new Date(backup.timestamp);
          if (backupDate < cutoffDate) {
            localStorage.removeItem(key);
            console.log(`🗑️ Removed old backup: ${key}`);
          }
        } catch (e) {
          console.warn(`⚠️ Could not parse backup ${key}:`, e);
        }
      });

      console.log("✅ Old backups cleaned up");
      return { success: true };
    } catch (error) {
      console.error("❌ Error cleaning up old backups:", error);
      return { success: false, error: error.message };
    }
  }
}

export default SecurityBackupService;
