# 🏥 MedCure-Pro: Professional Pharmacy Management System

## 📋 System Overview

MedCure-Pro is an enterprise-grade Point of Sale (POS) and Inventory Management System specifically designed for pharmaceutical operations. Built with React 19, Vite, and Supabase, it provides real-time inventory management, batch tracking, transaction processing, intelligent notifications, and comprehensive reporting capabilities.

## ✨ Key Features

### 🎯 **Core POS Functionality**

- **Real-time Stock Management**: Live inventory tracking with automatic deduction
- **Multi-unit Support**: Handle pieces, sheets, and boxes with automatic conversion
- **Professional Transaction Processing**: Two-phase commit (create → complete)
- **PWD/Senior Discounts**: Automated discount application with ID validation
- **Customer Management**: Support for walk-in, new, and existing customers
- **Multiple Payment Methods**: Cash, card, and other payment options
- **Receipt Generation**: Professional receipt printing and PDF export
- **Cart Management**: Real-time cart calculations with tax and discounts

### 💼 **Transaction Management**

- **Transaction History**: Complete sales record with search and filtering
- **Edit Transactions**: Modify completed transactions within 24 hours
- **Undo System**: Complete transaction reversal with stock restoration
- **Audit Trail**: Full transaction history with edit reasons and timestamps
- **Status Management**: Pending → Completed → Cancelled workflow
- **Export Capabilities**: CSV and PDF export of transaction data

### � **Advanced Inventory Management**

- **Product CRUD Operations**: Create, read, update, and delete products
- **Batch Tracking**: Complete batch management with lot numbers
- **Expiry Date Monitoring**: Track expiration dates per batch
- **Multi-category Support**: Organize products by custom categories
- **Standardized Product Display**: Consistent product information across all pages
- **Stock Level Alerts**: Automatic low stock and out-of-stock notifications
- **Bulk Import/Export**: CSV import for products and batches
- **Archive System**: Soft delete with archive/unarchive functionality
- **Advanced Filtering**: Search by name, category, brand, supplier, expiry status
- **Stock Valuation**: Real-time inventory value calculations

### 🔔 **Intelligent Notification System**

- **Real-time Alerts**: Instant notifications for critical events
- **Smart Notifications**:
  - **Out-of-Stock Alerts**: Immediate POS alerts when stock reaches zero
  - **Low Stock Warnings**: Configurable threshold-based alerts (15min-24hr intervals)
  - **Expiring Products**: Batch expiry monitoring (1hr-24hr intervals)
  - **Sale Notifications**: Transaction completion confirmations
- **Database Deduplication**: Prevents notification spam (24hr cooldown)
- **Email Integration**: Optional email notifications for critical events
- **User Preferences**: Customizable notification intervals and settings
- **Notification History**: Complete audit trail of all alerts
- **Unread Count**: Real-time notification badge updates

### 🗂️ **Batch Management System**

- **Batch FIFO Support**: First-in, first-out inventory management
- **Lot Number Tracking**: Complete batch traceability
- **Expiry Status Labels**: Visual indicators (Expired, Critical, Expiring Soon, Good)
- **Batch Analytics**: Insights into batch performance and status
- **Quantity Tracking**: Monitor batch quantities and depletion
- **Cost Per Unit**: Track purchase costs per batch
- **Supplier Information**: Link batches to suppliers
- **Bulk Batch Import**: CSV import for batch data
- **Advanced Filters**: Filter by status, expiry, age, quantity, supplier, category
- **Date Range Filtering**: Custom date range queries

### �📊 **Advanced Analytics & Reporting**

- **Revenue Tracking**: Daily, monthly, and yearly revenue reports
- **Stock Analytics**: Low stock alerts and movement tracking
- **Performance Metrics**: Transaction counts and average sale values
- **Real-time Dashboard**: Live business metrics and KPIs
- **Top Products Analysis**: Best-selling products with visual charts
- **Category Insights**: Inventory value by category (Pie Chart)
- **Sales Trends**: Time-series sales data (Line Chart)
- **Inventory Reports**: Stock levels, valuations, and alerts
- **Financial Reports**: Profit margins, costs, and ROI analysis
- **Custom Date Ranges**: Flexible reporting periods
- **Export Functionality**: PDF and CSV report exports

### 👥 **Customer Management**

- **Customer Profiles**: Store customer information (name, phone, email, address)
- **Customer Types**: Walk-in, new, and existing customer support
- **Purchase History**: Track customer transaction history
- **Customer Search**: Quick lookup by name or phone
- **Customer Statistics**: Transaction count and total spent

### 👤 **User & Role Management**

- **Role-Based Access Control (RBAC)**: Admin, Pharmacist, Employee roles
- **User Management**: Create, update, and manage user accounts
- **Permission System**: Fine-grained permissions for different operations
- **User Authentication**: Secure login with Supabase Auth
- **Activity Tracking**: Monitor user actions and system usage

### 🎨 **Category Management**

- **Custom Categories**: Create and manage product categories
- **Category Statistics**: Product count per category
- **Color Coding**: Visual category identification
- **Category Descriptions**: Detailed category information
- **Category Insights**: Analytics by product category

### 🔒 **Security & Compliance**

- **Row Level Security (RLS)**: Database-level access control
- **User Authentication**: Secure login with role-based permissions
- **Audit Logging**: Complete trail of all system changes
- **Data Validation**: Comprehensive input validation and error handling
- **Secure Transactions**: Protected payment processing
- **Session Management**: Automatic logout and session timeouts

## 🏗️ **Technical Architecture**

### **Frontend Stack**

- **React 19**: Latest component-based UI framework with concurrent features
- **Vite 7**: Lightning-fast build tool and development server
- **React Router DOM 7**: Client-side routing and navigation
- **Tailwind CSS 4**: Utility-first styling framework
- **Lucide React**: Professional icon library (500+ icons)
- **Zustand**: Lightweight state management for POS
- **React Query**: Server state management and caching
- **Chart.js**: Data visualization and analytics charts
- **React Hook Form**: Performant form validation
- **Zod**: TypeScript-first schema validation

### **Backend Infrastructure**

- **Supabase**: PostgreSQL database with real-time capabilities
- **Row Level Security**: Database-level security policies
- **Stored Procedures**: Business logic implemented in PostgreSQL
- **Real-time Subscriptions**: Live data updates across clients
- **Database Functions**: Custom RPC functions for complex operations
- **Automated Triggers**: Database triggers for stock management

### **Key Services & Architecture**

**Domain-Driven Design Structure:**

```
services/
├── domains/
│   ├── inventory/          # Product, batch, category management
│   │   ├── productService.js
│   │   ├── enhancedBatchService.js
│   │   ├── advancedInventoryService.js
│   │   ├── unifiedCategoryService.js
│   │   └── inventoryService.js
│   ├── sales/             # POS, transactions, revenue
│   │   ├── transactionService.js
│   │   ├── salesService.js
│   │   └── posService.js
│   ├── analytics/         # Dashboards, reports, insights
│   │   ├── dashboardService.js
│   │   ├── analyticsService.js
│   │   └── reportingService.js
│   ├── auth/              # Authentication, user management
│   │   ├── authService.js
│   │   └── userService.js
│   └── notifications/     # Alert system, email notifications
│       └── NotificationService.js
├── core/                  # Shared utilities and helpers
└── CustomerService.js     # Customer management
```

**State Management:**

- `posStore.js`: Zustand store for real-time POS cart state
- `NotificationContext.jsx`: React Context for notification state
- `AuthContext.js`: Authentication state management
- `SettingsContext.jsx`: User preferences and settings

**Testing Infrastructure:**

- **Selenium WebDriver**: End-to-end testing
- **Mocha + Chai**: Test framework and assertions
- **Page Object Model**: Organized test structure
- **Automated Test Suite**: Login, Dashboard, POS, Inventory tests

## 🚀 **Installation & Setup**

### **Prerequisites**

- Node.js 18+ (LTS recommended)
- npm or yarn package manager
- Supabase account and project
- Modern web browser (Chrome, Firefox, Edge)

### **Environment Configuration**

Create `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Database Setup**

1. Create a new Supabase project
2. Execute database schema in Supabase SQL Editor
3. Set up Row Level Security (RLS) policies
4. Configure authentication settings
5. Import initial data if needed

### **Development Setup**

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Application will run on http://localhost:5173
```

### **Build for Production**

```bash
# Create optimized production build
npm run build

# Preview production build
npm run preview
```

### **Testing**

```bash
# Run all tests
npm test

# Run tests in headless mode
npm run test:headless

# Run specific test suites
npm run test:login
npm run test:dashboard
npm run test:inventory
npm run test:pos

# Verify Selenium setup
npm run test:verify
```

## 💡 **Core Workflows**

### **1. Sale Processing (POS)**

```
Select Products → Add to Cart → Apply Discounts (PWD/Senior)
→ Enter Customer Info → Process Payment → Generate Receipt
→ Automatic Stock Deduction → Notifications
```

### **2. Inventory Management**

```
Add Product → Set Category → Define Pricing → Add Batches
→ Set Expiry Dates → Monitor Stock Levels → Receive Alerts
→ Restock as Needed
```

### **3. Batch Management**

```
Create Product → Add Batch (Lot Number, Expiry, Quantity, Cost)
→ Track FIFO → Monitor Expiry → Receive Alerts
→ Manage Stock Rotation
```

### **4. Transaction Editing**

```
View Transaction History → Select Transaction → Edit Items/Quantities
→ Provide Reason → Save Changes → Stock Automatically Adjusted
```

### **5. Notification Management**

```
Configure Intervals (Low Stock: 15min-24hr, Expiring: 1hr-24hr)
→ Enable/Disable Email → Manual Health Check
→ Receive Real-time Alerts → Mark as Read
```

### **6. Stock Monitoring**

```
Real-time Stock Check → Prevent Overselling → Auto-deduct on Sale
→ Low Stock Alerts → Out-of-Stock Notifications
→ Restore on Undo
```

## 📈 **Business Benefits**

### **Operational Efficiency**

- ⚡ **Fast Processing**: Optimized checkout workflow with real-time cart updates
- 🎯 **Error Prevention**: Real-time stock validation and overselling protection
- 📱 **User-friendly**: Intuitive interface with modern UI/UX design
- 🔄 **Real-time Updates**: Live inventory synchronization across all devices
- 🔔 **Proactive Alerts**: Automated notifications for critical events
- 📊 **Visual Analytics**: Charts and graphs for quick insights

### **Financial Control**

- 💰 **Accurate Revenue**: Automated discount calculations and tax handling
- 📊 **Comprehensive Reports**: Detailed sales, inventory, and financial analytics
- 🔍 **Audit Trail**: Complete transaction history with edit tracking
- ⚖️ **Compliance**: PWD/Senior discount regulations support
- 💹 **Profit Analysis**: Real-time profit margins and ROI calculations
- 📉 **Cost Tracking**: Monitor costs per batch and product

### **Inventory Management**

- 📦 **Multi-unit Tracking**: Pieces, sheets, boxes with automatic conversion
- ⚠️ **Smart Alerts**: Proactive low stock, out-of-stock, and expiry notifications
- 🔄 **FIFO Support**: Batch inventory management with lot tracking
- 📈 **Movement History**: Complete stock audit trail
- 🗂️ **Batch Management**: Track expiry dates, lot numbers, and costs
- 💼 **Category Organization**: Organize products by custom categories
- 📊 **Valuation Reports**: Real-time inventory value calculations

### **Customer Experience**

- 🛒 **Quick Checkout**: Fast POS transactions with multiple payment methods
- 👥 **Customer Profiles**: Store customer data for repeat business
- 📜 **Professional Receipts**: Clean, printable receipts
- � **Flexible Discounts**: PWD/Senior citizen discount support
- 📧 **Email Notifications**: Optional email alerts for important events

## �🔧 **Professional Features**

### **Notification System**

- **Hybrid Immediate + Smart Cooldown**: POS sends immediate alerts, health checks use configurable intervals
- **Database Deduplication**: Prevents notification spam with 24-hour default cooldown
- **User-Configurable Settings**:
  - Low Stock: 15 minutes to 24 hours
  - Expiring Products: 1 hour to 24 hours
  - Email toggle for critical alerts
- **Real-time Updates**: Instant notification badge updates
- **Transparent Logging**: Enhanced console logs for debugging
- **Priority System**: Critical, High, Medium, Low priority levels
- **Category-Based**: Sales, Inventory, System, Expiry categories

### **Transaction System**

- **Edit Window**: 24-hour modification period with audit trail
- **Stock Management**: Automatic stock restoration on edits and cancellations
- **Audit Compliance**: Mandatory edit reasons and user tracking
- **Price Accuracy**: Real-time revenue calculation updates
- **Transaction Status**: Pending, Completed, Cancelled states
- **Payment Tracking**: Multiple payment methods with change calculation

### **Batch Tracking System**

- **FIFO Management**: First-in, first-out inventory rotation
- **Expiry Monitoring**: Automatic alerts for expiring products
- **Lot Number Tracking**: Complete batch traceability
- **Cost Analysis**: Track cost per unit for profit calculations
- **Supplier Linking**: Associate batches with suppliers
- **Bulk Operations**: CSV import/export for batch data
- **Visual Status**: Color-coded expiry status indicators

### **Analytics & Reporting**

- **Accurate Calculations**: Excludes cancelled transactions
- **Real-time Reporting**: Live dashboard updates
- **Historical Analysis**: Trend tracking and comparisons
- **Performance Metrics**: KPIs and business intelligence
- **Custom Reports**: Inventory, Sales, Financial, Performance reports
- **Export Options**: PDF and CSV formats
- **Visual Charts**: Line, Bar, Pie charts for data visualization

### **Category Management**

- **Dynamic Categories**: Create, update, delete categories
- **Product Count Tracking**: Real-time product counts per category
- **Color Coding**: Visual category identification
- **Category Analytics**: Inventory value by category
- **Automatic Creation**: Categories created during imports
- **Validation**: Prevent duplicate categories

### **Error Handling & Recovery**

- **Graceful Degradation**: System continues operating during errors
- **User Feedback**: Clear error messages and guidance
- **Data Integrity**: Transaction rollback on failures
- **Recovery Procedures**: Automatic system recovery
- **Validation**: Comprehensive input validation
- **Error Logging**: Detailed error tracking and debugging

## 🎯 **Production Deployment**

### **Performance Optimization**

- Database indexes for fast queries
- Optimized component rendering with React.memo
- Efficient state management with Zustand
- Real-time subscription optimization
- Code splitting and lazy loading
- Image optimization
- Minified production builds

### **Security Measures**

- Row Level Security (RLS) policies on all tables
- Input validation and sanitization
- Secure authentication flow with Supabase Auth
- API endpoint protection
- HTTPS enforcement
- XSS and CSRF protection
- Environment variable security

### **Monitoring & Maintenance**

- Error logging and tracking
- Performance monitoring
- Database maintenance procedures
- Regular backup strategies
- Health check endpoints
- Notification system monitoring

## � **System Pages & Features**

### **📱 Pages Overview**

| Page                     | Route                  | Description            | Key Features                             |
| ------------------------ | ---------------------- | ---------------------- | ---------------------------------------- |
| **Dashboard**            | `/dashboard`           | Main analytics hub     | Revenue metrics, charts, quick actions   |
| **Point of Sale**        | `/pos`                 | Transaction processing | Product search, cart, checkout, receipts |
| **Drug Inventory**       | `/inventory`           | Product management     | CRUD operations, filters, bulk import    |
| **Batch Management**     | `/batch-management`    | Batch tracking         | Expiry monitoring, FIFO, lot numbers     |
| **Transaction History**  | `/transaction-history` | Sales records          | View, search, export transactions        |
| **Customer Information** | `/customers`           | Customer database      | Profiles, history, statistics            |
| **User Management**      | `/user-management`     | Admin panel            | Create users, roles, permissions         |
| **System Settings**      | `/system-settings`     | Configuration          | Notification settings, preferences       |
| **Analytics Reports**    | Analytics section      | Business reports       | Inventory, sales, financial reports      |

### **🎨 UI Components**

- **Professional Pagination**: Reusable pagination with page size controls
- **Standardized Product Display**: Consistent product cards across all pages
- **Loading States**: Skeleton screens and spinners for better UX
- **Toast Notifications**: Success/error feedback messages
- **Modal Dialogs**: Checkout, product forms, confirmations
- **Charts**: Line, Bar, Pie charts for analytics
- **Filters & Search**: Advanced filtering on all data tables
- **Cards & Badges**: Status indicators and metric cards

## �📞 **Support & Maintenance**

### **System Health Checks**

- Daily revenue reconciliation
- Stock level monitoring (automated notifications)
- User activity tracking
- Error rate monitoring
- Notification system health checks
- Database performance monitoring

### **Regular Maintenance**

- Database optimization and cleanup
- Security updates and patches
- Performance tuning
- Feature enhancements based on feedback
- Backup verification
- Log rotation

### **Notification System Health**

- Automatic health checks every 15 minutes
- Low stock monitoring (configurable intervals)
- Expiring products monitoring (configurable intervals)
- Out-of-stock immediate alerts
- Database deduplication status
- Email delivery monitoring

## 📚 **Documentation**

Additional documentation files included:

- **NOTIFICATION_SYSTEM_ANALYSIS.md**: Deep technical analysis of notification system
- **FIXES_APPLIED.md**: Comprehensive guide to implemented fixes
- **NOTIFICATION_QUICK_REFERENCE.md**: Daily operations guide for notifications

## 🛠️ **Development Tools**

- **ESLint**: Code linting and quality checks
- **Prettier**: Code formatting (if configured)
- **Vite DevTools**: Hot module replacement
- **React Query DevTools**: State debugging
- **Browser DevTools**: Console logging with emoji categorization

## 🔐 **User Roles & Permissions**

### **Admin**

- Full system access
- User management
- System settings
- All reports and analytics
- Transaction management

### **Pharmacist**

- POS transactions
- Inventory management
- Batch management
- Customer management
- View analytics

### **Employee**

- POS transactions
- View inventory
- Basic customer operations
- Limited reporting

---

## 🎉 **Project Status: Complete & Production Ready**

MedCure-Pro is a fully operational, enterprise-grade pharmacy management system developed as a comprehensive capstone project. The system features complete POS functionality, real-time inventory management, intelligent notification system, batch tracking, and professional-grade reporting capabilities. Built with modern technologies and best practices, it demonstrates full-stack development expertise and is optimized for pharmaceutical operations with industry compliance.

### **Technical Achievements**

✅ **Modern Tech Stack**: React 19, Vite 7, Supabase, Tailwind CSS 4  
✅ **Real-time Features**: Live notifications, stock updates, dashboard metrics  
✅ **Intelligent Systems**: Smart notifications with deduplication and configurable intervals  
✅ **Batch Management**: FIFO support, expiry tracking, lot number management  
✅ **Advanced Analytics**: Charts, reports, KPIs, financial metrics  
✅ **Security**: Row Level Security, RBAC, input validation  
✅ **Testing**: Selenium E2E tests with Page Object Model  
✅ **Professional UI**: Responsive design, loading states, error handling

### **Academic Excellence**

- **Project Type**: Capstone / Final Year Project
- **System Status**: ✅ Production Ready
- **Build Status**: ✅ Successful
- **Test Coverage**: ✅ E2E Tests Passing
- **Demo Ready**: ✅ Fully Functional
- **Documentation**: ✅ Comprehensive

**Project Version**: v2.0 (Production Release)  
**Last Updated**: October 2025  
**Status**: 🎓 **CAPSTONE COMPLETE**

---

## 🚀 **Quick Start Guide**

```bash
# 1. Clone the repository
git clone <repository-url>
cd MedCure_Official

# 2. Install dependencies
npm install

# 3. Configure environment
# Create .env file with your Supabase credentials
cp .env.example .env

# 4. Start development server
npm run dev

# 5. Access the application
# Open http://localhost:5173 in your browser

# 6. Run tests (optional)
npm test
```

## 📖 **Usage Tips**

### **First Time Setup**

1. Create a Supabase project
2. Run the database schema
3. Create an admin user
4. Import sample data (optional)
5. Configure notification settings

### **Daily Operations**

1. **Morning**: Check dashboard metrics and alerts
2. **During Day**: Process POS transactions
3. **Stock Management**: Monitor batch expiry and low stock alerts
4. **End of Day**: Review sales reports and reconcile

### **Best Practices**

- Enable email notifications for critical alerts
- Configure notification intervals based on your workflow
- Regularly check batch expiry dates
- Use batch management for FIFO rotation
- Export reports for record-keeping
- Maintain customer profiles for loyalty tracking

## 🤝 **Contributing**

This is a capstone project, but suggestions and feedback are welcome:

1. Report issues or bugs
2. Suggest feature enhancements
3. Provide feedback on UX/UI
4. Share deployment experiences

## 📄 **License**

This project is developed for educational purposes as part of a capstone project.

## 👨‍💻 **Developer**

**Christian (KurisuuChan)**  
Capstone Project - Pharmacy Management System  
October 2025

---

**⭐ If you find this project helpful, please consider giving it a star!**
