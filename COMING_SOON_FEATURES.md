# 🚀 Coming Soon Features - System Settings

## Overview

The MedCure Pharmacy System has marked **Two-Factor Authentication** and **Automatic Backups** as "Coming Soon" features. These advanced security and backup features are currently under development and will be available in future releases.

---

## 🔐 Two-Factor Authentication (2FA)

### Status: 🚧 Coming Soon

**Visual Indicator:**

- Purple "Coming Soon" badge in section header
- Grayed out toggle switch (disabled)
- Development status message: "🚀 Feature under development - Available in next release"

### What This Feature Will Do

When implemented, Two-Factor Authentication will provide an additional layer of security by requiring users to provide two forms of identification:

1. **First Factor**: Username and password (something you know)
2. **Second Factor**: Time-based code from authenticator app (something you have)

### Planned Features

#### Authentication Methods

- 📱 **Authenticator Apps**: Google Authenticator, Microsoft Authenticator, Authy
- 📧 **Email Codes**: One-time codes sent via email
- 📲 **SMS Codes**: One-time codes sent via text message (optional)

#### User Experience

- **Setup Wizard**: Easy 5-step setup process
- **QR Code Scanning**: Quick setup with authenticator apps
- **Backup Codes**: Emergency access codes (print and store safely)
- **Remember Device**: Option to trust specific devices for 30 days

#### Admin Controls

- **Enforce 2FA**: Require 2FA for all admin users
- **Grace Period**: Allow users X days to set up 2FA
- **Bypass for Specific Roles**: Optional bypass for certain user types
- **2FA Audit Log**: Track 2FA setup and usage

### Technical Implementation Plan

```javascript
// Planned 2FA Service
class TwoFactorAuthService {
  // Generate secret key for user
  async generateSecret(userId) {
    // Create unique secret for TOTP
  }

  // Verify TOTP code
  async verifyCode(userId, code) {
    // Validate 6-digit code
  }

  // Generate backup codes
  async generateBackupCodes(userId) {
    // Create 10 backup codes
  }

  // Send email/SMS code
  async sendVerificationCode(userId, method) {
    // Send code via email or SMS
  }
}
```

### Database Schema (Planned)

```sql
-- user_2fa table
CREATE TABLE user_2fa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  secret_key TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  backup_codes TEXT[], -- Array of hashed backup codes
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- user_2fa_logs table
CREATE TABLE user_2fa_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT, -- 'setup', 'verify', 'disable', 'backup_used'
  success BOOLEAN,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### UI Components (Planned)

1. **Setup Modal**

   - QR code display
   - Manual entry option
   - Test code verification
   - Backup codes display

2. **Login Flow**

   - Username/password entry
   - 2FA code prompt
   - "Use backup code" option
   - "Remember device" checkbox

3. **Settings Page**
   - Enable/disable toggle
   - View backup codes
   - Regenerate backup codes
   - View trusted devices

### Security Considerations

- ✅ TOTP (Time-based One-Time Password) standard
- ✅ 30-second code validity window
- ✅ Rate limiting on code verification
- ✅ Encrypted secret storage
- ✅ Hashed backup codes
- ✅ Audit logging for all 2FA actions

### Timeline

- **Phase 1** (Month 1): Backend implementation, database schema
- **Phase 2** (Month 2): Setup wizard, authenticator app support
- **Phase 3** (Month 3): Email/SMS codes, backup codes
- **Phase 4** (Month 4): Admin controls, audit logs, testing
- **Release** (Month 5): Production deployment

---

## 📅 Automatic Backups

### Status: 🚧 Coming Soon

**Visual Indicator:**

- Blue "Coming Soon" badge in section header
- Grayed out toggle switch (disabled)
- Development status message: "🚀 Feature under development - Available in next release"

### What This Feature Will Do

When implemented, Automatic Backups will automatically create system backups on a regular schedule without manual intervention.

### Current Manual Backup System ✅

**Already Available:**

- 🔵 Create Backup (Manual)
- 🟢 Download Backup
- 🟠 Import Backup
- 🟣 Restore Backup

**What's Missing:**

- ⏰ Scheduled automatic backups
- 📊 Backup history management
- 🔄 Automatic rotation and cleanup
- 📧 Email notifications

### Planned Features

#### Scheduling Options

- ⏰ **Hourly**: Every 1 hour (high-frequency updates)
- 📅 **Daily**: Every day at specific time (e.g., 2:00 AM)
- 📆 **Weekly**: Every Sunday at 2:00 AM
- 📊 **Monthly**: 1st of each month

#### Backup Management

- **Retention Policy**: Keep last X days/weeks/months
- **Auto-Cleanup**: Delete old backups automatically
- **Storage Limits**: Set max storage space for backups
- **Compression**: Compress backups to save space

#### Notifications

- **Success Alerts**: Email when backup completes
- **Failure Alerts**: Urgent email if backup fails
- **Summary Reports**: Weekly backup summary
- **Storage Warnings**: Alert when storage is full

#### Advanced Features

- **Incremental Backups**: Only backup changes (not full data)
- **Differential Backups**: Backup changes since last full backup
- **Backup Verification**: Automatically test backup integrity
- **Cloud Upload**: Auto-upload to cloud storage (Google Drive, Dropbox, AWS S3)

### Technical Implementation Plan

```javascript
// Planned Automatic Backup Service
class AutomaticBackupService {
  // Schedule backup job
  async scheduleBackup(frequency, time) {
    // Use node-cron or similar scheduler
  }

  // Execute scheduled backup
  async executeScheduledBackup() {
    // Create backup
    // Store in designated location
    // Send notification
  }

  // Cleanup old backups
  async cleanupOldBackups(retentionDays) {
    // Delete backups older than retention period
  }

  // Upload to cloud
  async uploadToCloud(backupFile, provider) {
    // Upload to Google Drive, Dropbox, etc.
  }
}
```

### Database Schema (Planned)

```sql
-- backup_schedules table
CREATE TABLE backup_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  frequency TEXT, -- 'hourly', 'daily', 'weekly', 'monthly'
  time TIME, -- Specific time for daily backups
  day_of_week INT, -- 0-6 for weekly backups
  day_of_month INT, -- 1-31 for monthly backups
  is_enabled BOOLEAN DEFAULT true,
  last_run TIMESTAMP,
  next_run TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- backup_history table
CREATE TABLE backup_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  backup_type TEXT, -- 'manual', 'scheduled', 'incremental'
  status TEXT, -- 'completed', 'failed', 'in_progress'
  file_path TEXT,
  file_size BIGINT, -- bytes
  duration INT, -- seconds
  records_backed_up JSONB, -- {products: 373, categories: 94, ...}
  error_message TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- backup_notifications table
CREATE TABLE backup_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  backup_id UUID REFERENCES backup_history(id) ON DELETE CASCADE,
  notification_type TEXT, -- 'success', 'failure', 'warning'
  recipients TEXT[], -- Array of email addresses
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### UI Components (Planned)

1. **Schedule Configuration**

   - Frequency dropdown
   - Time picker
   - Day of week/month selector
   - Enable/disable toggle

2. **Backup History Table**

   - Date & time
   - Status (success/failed)
   - Size
   - Duration
   - Records count
   - Download button
   - Actions (delete, restore)

3. **Retention Settings**

   - Retention period slider
   - Storage usage chart
   - Auto-cleanup toggle

4. **Notification Settings**
   - Email addresses
   - Notification types
   - Test email button

### Configuration Options

```javascript
// Planned settings structure
const autoBackupSettings = {
  enabled: true,
  frequency: "daily", // 'hourly', 'daily', 'weekly', 'monthly'
  time: "02:00", // 24-hour format
  dayOfWeek: 0, // 0 = Sunday
  dayOfMonth: 1,
  retentionDays: 30,
  maxBackups: 10,
  compression: true,
  notifications: {
    onSuccess: true,
    onFailure: true,
    emailList: ["admin@medcure.com"],
  },
  cloudSync: {
    enabled: false,
    provider: "google-drive", // 'dropbox', 's3'
    folderId: "abc123",
  },
};
```

### Cron Expressions (Planned)

```javascript
// Scheduling examples
const schedules = {
  hourly: "0 * * * *", // Every hour at minute 0
  daily: "0 2 * * *", // Every day at 2:00 AM
  weekly: "0 2 * * 0", // Every Sunday at 2:00 AM
  monthly: "0 2 1 * *", // 1st of month at 2:00 AM
  custom: "0 */4 * * *", // Every 4 hours
};
```

### Background Job System

Will require a backend job scheduler:

**Option 1: Node.js + node-cron**

```javascript
const cron = require("node-cron");

// Schedule daily backup at 2:00 AM
cron.schedule("0 2 * * *", async () => {
  await AutomaticBackupService.executeScheduledBackup();
});
```

**Option 2: Supabase Edge Functions + pg_cron**

```sql
-- PostgreSQL cron extension
SELECT cron.schedule('daily-backup', '0 2 * * *',
  'SELECT backup_all_tables();'
);
```

### Timeline

- **Phase 1** (Month 1): Backend scheduler setup, cron jobs
- **Phase 2** (Month 2): Basic scheduling (hourly, daily, weekly)
- **Phase 3** (Month 3): Retention policy, auto-cleanup
- **Phase 4** (Month 4): Email notifications, backup history
- **Phase 5** (Month 5): Cloud sync (Google Drive, Dropbox)
- **Phase 6** (Month 6): Incremental backups, compression
- **Release** (Month 7): Production deployment

---

## 🎯 Why "Coming Soon"?

### Reasons for Delayed Implementation

1. **Backend Requirements**

   - Both features require server-side implementations
   - Need dedicated backend services running 24/7
   - Current system is primarily frontend with Supabase

2. **Infrastructure Needs**

   - **2FA**: Requires email/SMS service integration
   - **Auto Backups**: Requires cron job scheduler
   - Both need additional database tables

3. **Security Considerations**

   - 2FA requires careful security implementation
   - Must meet industry standards (TOTP, RFC 6238)
   - Needs thorough testing and auditing

4. **Development Priority**
   - Core features prioritized first (manual backups ✅)
   - These are enhancement features
   - Will be developed after main system is stable

### Current Workarounds

#### For 2FA:

- ✅ Strong password policy (implemented)
- ✅ Session timeout (implemented)
- ✅ Manual account monitoring

#### For Automatic Backups:

- ✅ Manual backup (implemented)
- ✅ Download backup (implemented)
- ✅ Import backup (implemented)
- ✅ Restore backup (implemented)
- 📅 **Workaround**: Create manual backups daily/weekly

---

## 📢 How Users Are Informed

### Visual Indicators

Both features have clear visual indicators:

```
┌──────────────────────────────────────────┐
│ 🛡️ Authentication Security  [Coming Soon]│
│                                          │
│ ┌──────────────────────────────────────┐│
│ │ Two-Factor Authentication         ⚪ ││
│ │ Require 2FA for admin accounts      ││
│ │ 🚀 Feature under development -      ││
│ │    Available in next release        ││
│ └──────────────────────────────────────┘│
└──────────────────────────────────────────┘
```

### Badge Styles

**Two-Factor Authentication (Purple):**

```css
background: purple-100
border: purple-300
text: purple-700
```

**Automatic Backups (Blue):**

```css
background: blue-100
border: blue-300
text: blue-700
```

### Disabled State

Both sections have:

- ❌ Disabled toggle switches
- 👆 `cursor-not-allowed` on hover
- 😶 Reduced opacity (60%)
- 📝 Explanatory text below title

---

## 🔮 Expected Release Timeline

### Near-Term (1-3 months)

- ✅ Manual backup system (DONE)
- ✅ Download/Import/Restore (DONE)
- 🚧 Documentation and testing

### Mid-Term (4-6 months)

- 🔐 Two-Factor Authentication development
- 📧 Email notification system
- 🔒 Enhanced security features

### Long-Term (7-12 months)

- 📅 Automatic Backups with scheduling
- ☁️ Cloud integration
- 📊 Advanced backup management

---

## 💡 User Recommendations

### For Security (Until 2FA is Available)

1. **Strong Passwords**: Use passwords with 12+ characters
2. **Unique Passwords**: Don't reuse passwords across sites
3. **Password Managers**: Use LastPass, 1Password, or Bitwarden
4. **Regular Updates**: Change admin passwords every 90 days
5. **Monitor Access**: Review user accounts regularly

### For Backups (Until Auto Backups Available)

1. **Daily Manual Backups**: Create backup every day
2. **Download & Store**: Download backup files to safe location
3. **Multiple Locations**: Store in computer + cloud + USB
4. **Test Restores**: Periodically test import/restore
5. **Set Reminders**: Calendar reminder for daily backups

### Backup Schedule Recommendation

```
Monday    - Create + Download backup (2 MB)
Tuesday   - Create + Download backup
Wednesday - Create + Download backup
Thursday  - Create + Download backup
Friday    - Create + Download backup (Keep this!)
Saturday  - Optional
Sunday    - Create + Download backup (Keep this!)
```

Keep at least:

- ✅ Last 7 daily backups
- ✅ Last 4 weekly backups (Friday or Sunday)
- ✅ Last 3 monthly backups

---

## 📝 Feedback & Requests

Users can request priority for these features:

**How to Request:**

1. Go to GitHub: https://github.com/KurisuuChan/MedCure-Web-Pro
2. Create an issue with tag: `enhancement`
3. Vote on existing feature requests with 👍
4. Comment with use cases

**High Priority Indicators:**

- 🔥 10+ user requests
- 💼 Business critical need
- 🏥 Healthcare compliance requirement

---

## 🎓 Summary

**Current Status:**

- ✅ **Manual Backups**: Fully functional
- ✅ **Download/Import/Restore**: Complete
- 🚧 **Two-Factor Authentication**: Coming Soon (Purple badge)
- 🚧 **Automatic Backups**: Coming Soon (Blue badge)

**User Experience:**

- Clear visual indicators ("Coming Soon" badges)
- Disabled controls with explanatory messages
- No functionality loss (manual backups work great!)

**Timeline:**

- 2FA: 4-6 months
- Automatic Backups: 7-12 months

**Workarounds:**

- Use strong passwords until 2FA available
- Create daily manual backups until auto-backups ready

---

_Last Updated: October 8, 2025_  
_Status: Coming Soon Features Documented_ ✅
