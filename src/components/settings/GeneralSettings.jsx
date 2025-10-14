import { useState, useEffect } from "react";
import {
  Globe,
  DollarSign,
  Save,
  CheckCircle,
  Upload,
  X,
  ImageIcon,
} from "lucide-react";
import { useSettings } from "../../contexts/SettingsContext";

function GeneralSettings() {
  const { settings: globalSettings, updateSettings } = useSettings();

  const [settings, setSettings] = useState({
    businessName: globalSettings.businessName || "MedCure Pharmacy",
    businessLogo: globalSettings.businessLogo || null,
    currency: globalSettings.currency || "PHP",
    taxRate: globalSettings.taxRate || "12",
    timezone: globalSettings.timezone || "Asia/Manila",
    enableNotifications: globalSettings.enableNotifications ?? true,
    enableEmailAlerts: globalSettings.enableEmailAlerts ?? true,
  });

  const [saved, setSaved] = useState(false);
  const [logoPreview, setLogoPreview] = useState(globalSettings.businessLogo);

  // Only sync with global settings on initial mount or when specifically needed
  useEffect(() => {
    setSettings({
      businessName: globalSettings.businessName || "MedCure Pharmacy",
      businessLogo: globalSettings.businessLogo || null,
      currency: globalSettings.currency || "PHP",
      taxRate: globalSettings.taxRate || "12",
      timezone: globalSettings.timezone || "Asia/Manila",
      enableNotifications: globalSettings.enableNotifications ?? true,
      enableEmailAlerts: globalSettings.enableEmailAlerts ?? true,
    });
    setLogoPreview(globalSettings.businessLogo);
  }, [
    globalSettings.businessName,
    globalSettings.businessLogo,
    globalSettings.currency,
    globalSettings.taxRate,
    globalSettings.timezone,
    globalSettings.enableNotifications,
    globalSettings.enableEmailAlerts,
  ]);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setLogoPreview(base64String);
        setSettings({ ...settings, businessLogo: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setSettings({ ...settings, businessLogo: null });
  };

  const handleSave = async () => {
    try {
      console.log("💾 Saving settings:", settings);
      await updateSettings(settings);
      console.log("✅ Settings saved successfully");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("❌ Error saving settings:", error);
      alert("Failed to save settings. Please try again.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Business Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <Globe className="h-5 w-5 text-gray-500" />
          <span>Business Information</span>
        </h3>

        {/* Logo Upload Section */}
        <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="relative">
                {logoPreview ? (
                  <div className="relative group">
                    <img
                      src={logoPreview}
                      alt="Business Logo"
                      className="w-24 h-24 rounded-lg object-cover border-2 border-blue-300 shadow-md"
                    />
                    <button
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-300">
                    <ImageIcon className="h-10 w-10 text-blue-400" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1">
              <h4 className="text-base font-semibold text-gray-900 mb-2">
                Business Logo
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Upload your business logo to personalize the sidebar.
                Recommended size: 256x256px or larger. Max file size: 2MB.
              </p>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors shadow-md hover:shadow-lg">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm font-medium">Upload Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                {logoPreview && (
                  <button
                    onClick={handleRemoveLogo}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    Remove Logo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Business Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Name
            </label>
            <input
              type="text"
              value={settings.businessName}
              onChange={(e) =>
                setSettings({ ...settings, businessName: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter your business name"
            />
            <p className="text-xs text-gray-500 mt-1">
              This will appear in the sidebar and throughout the system
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={settings.timezone}
              onChange={(e) =>
                setSettings({ ...settings, timezone: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="Asia/Manila">Asia/Manila (GMT+8)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
              <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Financial Configuration */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <DollarSign className="h-5 w-5 text-gray-500" />
          <span>Financial Configuration</span>
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select
            value={settings.currency}
            onChange={(e) =>
              setSettings({ ...settings, currency: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent max-w-md"
          >
            <option value="PHP">Philippine Peso (₱)</option>
            <option value="USD">US Dollar ($)</option>
            <option value="EUR">Euro (€)</option>
          </select>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t">
        {saved && (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Settings saved!</span>
          </div>
        )}
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Save className="h-4 w-4" />
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  );
}

export default GeneralSettings;
