// 📊 **ANALYTICS DOMAIN SERVICES**
// All analytics, reporting, and dashboard services

export { DashboardService } from "./dashboardService";
export { AnalyticsService } from "./analyticsService";
export { ReportingService } from "./reportingService";
export { AuditService, ReportsService } from "./auditReportsService";

// Import for default export
import { DashboardService } from "./dashboardService";
import { AnalyticsService } from "./analyticsService";
import { ReportingService } from "./reportingService";
import { AuditService, ReportsService } from "./auditReportsService";

export default {
  DashboardService,
  AnalyticsService,
  ReportingService,
  AuditService,
  ReportsService,
};
