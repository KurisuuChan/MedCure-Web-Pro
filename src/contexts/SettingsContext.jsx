import React, { createContext, useContext, useState, useEffect } from "react";
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
      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value");

      if (error) {
        console.error("Error loading settings:", error);
        // Fall back to localStorage
        const savedSettings = localStorage.getItem("medcure-settings");
        if (savedSettings) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
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
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);

      // Save to localStorage immediately
      localStorage.setItem("medcure-settings", JSON.stringify(updatedSettings));

      // Save to Supabase
      const settingsMap = {
        businessName: "business_name",
        businessLogo: "business_logo",
        currency: "currency",
        taxRate: "tax_rate",
        timezone: "timezone",
        enableNotifications: "enable_notifications",
        enableEmailAlerts: "enable_email_alerts",
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
          console.error(`Error updating ${update.setting_key}:`, error);
        }
      }

      console.log("✅ Settings saved to Supabase");
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  const getSettingType = (key) => {
    // Return the actual data type that matches the database constraint
    // Constraint: setting_type IN ('string', 'number', 'boolean', 'json')
    if (key.includes("enable_")) return "boolean"; // enable_notifications, enable_email_alerts
    if (key === "tax_rate") return "string"; // stored as string in DB
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

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings, resetSettings, isLoading }}
    >
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
