import { useState, useEffect } from "react";
import {
  Shield,
  Lock,
  Database,
  Download,
  Upload,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader,
} from "lucide-react";
import SecurityBackupService from "../../services/security/securityBackupService";

function SecurityBackup() {
  const [securitySettings, setSecuritySettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backing, setBacking] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lastBackup, setLastBackup] = useState(null);
  const [showBackupModal, setShowBackupModal] = useState(false);

  useEffect(() => {
    loadSecuritySettings();
    loadLastBackupInfo();
  }, []);

  const loadSecuritySettings = async () => {
    setLoading(true);
    try {
      const settings = await SecurityBackupService.loadSecuritySettings();
      setSecuritySettings(settings);
    } catch (error) {
      console.error("Failed to load security settings:", error);
      // Use default settings on error
      setSecuritySettings({
        twoFactorAuth: false,
        passwordMinLength: "8",
        sessionTimeout: "30",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLastBackupInfo = async () => {
    try {
      const backup = await SecurityBackupService.getLastBackupInfo();
      setLastBackup(backup);
    } catch (error) {
      console.error("Failed to load backup info:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await SecurityBackupService.saveSecuritySettings(securitySettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save security settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleManualBackup = () => {
    setShowBackupModal(true);
  };

  const confirmBackup = async () => {
    setBacking(true);
    try {
      await SecurityBackupService.createManualBackup();
      await loadLastBackupInfo();
      setShowBackupModal(false);
    } catch (error) {
      console.error("Backup failed:", error);
    } finally {
      setBacking(false);
    }
  };

  const handleDownloadBackup = () => {
    alert("Download backup feature - to be implemented");
  };

  const handleRestoreBackup = () => {
    alert("Restore backup feature - to be implemented");
  };

  const handleImportBackup = () => {
    alert("Import backup feature - to be implemented");
  };
  if (loading || !securitySettings) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Security Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <Shield className="h-5 w-5 text-gray-500" />
          <span>Security Settings</span>
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">
                Two-Factor Authentication
              </p>
              <p className="text-sm text-gray-500">
                Add an extra layer of security
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securitySettings.twoFactorAuth}
                onChange={(e) =>
                  setSecuritySettings({
                    ...securitySettings,
                    twoFactorAuth: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Backup Management */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <Database className="h-5 w-5 text-gray-500" />
          <span>Data Backup</span>
        </h3>

        {lastBackup && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 text-green-700">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                Last backup: {new Date(lastBackup.created_at).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleManualBackup}
            disabled={backing}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <Database className="h-4 w-4" />
            <span>Create Backup</span>
          </button>

          <button
            onClick={handleDownloadBackup}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download Backup</span>
          </button>

          <button
            onClick={handleRestoreBackup}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Restore Backup</span>
          </button>

          <button
            onClick={handleImportBackup}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Import Backup</span>
          </button>
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
          disabled={saving}
          className="flex items-center space-x-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
          <span>Save Security Settings</span>
        </button>
      </div>

      {/* Modals */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Create Backup</h3>
            <p className="text-gray-600 mb-6">
              This will create a backup of all your data. Continue?
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowBackupModal(false)}
                disabled={backing}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmBackup}
                disabled={backing}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {backing ? "Creating..." : "Create Backup"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SecurityBackup;
