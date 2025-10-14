import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { supabase } from "../config/supabase";

const SettingsContext = createContext();

const DEFAULT_SETTINGS = {
  businessName: "MedCure Pro",
  businessLogo: null,
  currency: "PHP",
  taxRate: "12",
  timezone: "Asia/Manila",
  enableNotifications: true,
  enableEmailAlerts: true,
  lowStockCheckInterval: 60, // minutes (1 hour default)
  expiringCheckInterval: 360, // minutes (6 hours default)
  emailAlertsEnabled: false,
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from Supabase on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      console.log("📥 Loading settings from Supabase...");

      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value");

      if (error) {
        console.error("❌ Error loading settings from Supabase:", error);
        // Fall back to localStorage
        const savedSettings = localStorage.getItem("medcure-settings");
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
          console.log("✅ Loaded settings from localStorage:", parsedSettings);
        } else {
          console.log("ℹ️ No settings found, using defaults");
        }
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const loadedSettings = { ...DEFAULT_SETTINGS };

        data.forEach(({ setting_key, setting_value }) => {
          switch (setting_key) {
            case "business_name":
              loadedSettings.businessName = setting_value;
              break;
            case "business_logo":
              loadedSettings.businessLogo = setting_value;
              break;
            case "currency":
              loadedSettings.currency = setting_value;
              break;
            case "tax_rate":
              loadedSettings.taxRate = setting_value;
              break;
            case "timezone":
              loadedSettings.timezone = setting_value;
              break;
            case "enable_notifications":
              loadedSettings.enableNotifications = setting_value;
              break;
            case "enable_email_alerts":
              loadedSettings.enableEmailAlerts = setting_value;
              break;
            case "low_stock_check_interval":
              loadedSettings.lowStockCheckInterval = setting_value;
              break;
            case "expiring_check_interval":
              loadedSettings.expiringCheckInterval = setting_value;
              break;
            case "email_alerts_enabled":
              loadedSettings.emailAlertsEnabled = setting_value;
              break;
            default:
              break;
          }
        });

        setSettings(loadedSettings);
        // Also save to localStorage as backup
        localStorage.setItem(
          "medcure-settings",
          JSON.stringify(loadedSettings)
        );
        console.log("✅ Settings loaded from Supabase:", loadedSettings);
      } else {
        // No data in Supabase, check localStorage
        const savedSettings = localStorage.getItem("medcure-settings");
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
          console.log(
            "✅ Loaded settings from localStorage (no Supabase data):",
            parsedSettings
          );
        } else {
          console.log("ℹ️ No settings found anywhere, using defaults");
        }
      }
    } catch (error) {
      console.error("❌ Error loading settings:", error);
      // Try localStorage as final fallback
      const savedSettings = localStorage.getItem("medcure-settings");
      if (savedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
        console.log("✅ Loaded settings from localStorage (after error)");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };

      console.log("🔄 Updating settings:", updatedSettings);

      // Update state immediately
      setSettings(updatedSettings);

      // Save to localStorage immediately for quick access
      localStorage.setItem("medcure-settings", JSON.stringify(updatedSettings));
      console.log("💾 Saved to localStorage");

      // Save to Supabase
      const settingsMap = {
        businessName: "business_name",
        businessLogo: "business_logo",
        currency: "currency",
        taxRate: "tax_rate",
        timezone: "timezone",
        enableNotifications: "enable_notifications",
        enableEmailAlerts: "enable_email_alerts",
        lowStockCheckInterval: "low_stock_check_interval",
        expiringCheckInterval: "expiring_check_interval",
        emailAlertsEnabled: "email_alerts_enabled",
      };

      const updates = [];
      for (const [key, value] of Object.entries(newSettings)) {
        const settingKey = settingsMap[key];
        if (settingKey) {
          updates.push({
            setting_key: settingKey,
            setting_value: value,
            setting_type: getSettingType(settingKey),
          });
        }
      }

      // Save each setting to Supabase
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
          throw error;
        } else {
          console.log(`✅ Saved ${update.setting_key} to Supabase`);
        }
      }

      console.log("✅ All settings saved to Supabase successfully");
      return true;
    } catch (error) {
      console.error("❌ Error updating settings:", error);
      throw error;
    }
  };

  const getSettingType = (key) => {
    // Return the actual data type that matches the database constraint
    // Constraint: setting_type IN ('string', 'number', 'boolean', 'json')
    if (key.includes("enable_")) return "boolean"; // enable_notifications, enable_email_alerts, email_alerts_enabled
    if (key === "tax_rate") return "string"; // stored as string in DB
    if (key === "low_stock_check_interval" || key === "expiring_check_interval") return "number"; // notification intervals
    return "string"; // business_name, business_logo, currency, timezone
  };

  const resetSettings = async () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem("medcure-settings");

    // Reset in Supabase
    try {
      const { error } = await supabase
        .from("system_settings")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

      if (error) console.error("Error resetting settings:", error);
    } catch (error) {
      console.error("Error resetting settings:", error);
    }
  };

  const contextValue = useMemo(
    () => ({ settings, updateSettings, resetSettings, isLoading }),
    [settings, isLoading]
  );

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
