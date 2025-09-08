import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NotificationPreferences from "../features/notifications/components/NotificationPreferences.jsx";
import { NotificationService } from "../services/notificationService.js";

// Mock the notification service
vi.mock("../services/notificationService.js", () => ({
  NotificationService: vi.fn(() => ({
    getUserPreferences: vi.fn().mockResolvedValue({
      email: true,
      browser: true,
      mobile: false,
      sms: false,
      inventory_alerts: true,
      price_alerts: true,
      demand_alerts: false,
      ml_recommendations: true,
      quiet_hours_enabled: false,
      quiet_hours_start: "22:00",
      quiet_hours_end: "08:00",
      working_days_only: true,
      priority_filter: "medium",
    }),
    updateUserPreferences: vi.fn().mockResolvedValue({ success: true }),
    testNotification: vi.fn().mockResolvedValue({ success: true }),
  })),
}));

// Mock Supabase
vi.mock("../config/supabase.js", () => ({
  supabase: {},
}));

const mockProps = {
  isOpen: true,
  onClose: vi.fn(),
  userId: "test-user-id",
};

describe("NotificationPreferences Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render notification preferences modal", async () => {
    render(<NotificationPreferences {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Notification Preferences")).toBeInTheDocument();
      expect(screen.getByText("Delivery Methods")).toBeInTheDocument();
      expect(screen.getByText("Notification Types")).toBeInTheDocument();
      expect(screen.getByText("Timing & Schedule")).toBeInTheDocument();
    });
  });

  it("should load and display current preferences", async () => {
    render(<NotificationPreferences {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Email Notifications")).toBeChecked();
      expect(screen.getByLabelText("Browser Notifications")).toBeChecked();
      expect(screen.getByLabelText("Mobile Push")).not.toBeChecked();
      expect(screen.getByLabelText("SMS")).not.toBeChecked();
    });
  });

  it("should toggle delivery method preferences", async () => {
    const user = userEvent.setup();
    render(<NotificationPreferences {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Mobile Push")).toBeInTheDocument();
    });

    const mobileToggle = screen.getByLabelText("Mobile Push");
    await user.click(mobileToggle);

    expect(mobileToggle).toBeChecked();
  });

  it("should toggle notification type preferences", async () => {
    const user = userEvent.setup();
    render(<NotificationPreferences {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Demand Surge Alerts")).toBeInTheDocument();
    });

    const demandToggle = screen.getByLabelText("Demand Surge Alerts");
    await user.click(demandToggle);

    expect(demandToggle).toBeChecked();
  });

  it("should handle quiet hours configuration", async () => {
    const user = userEvent.setup();
    render(<NotificationPreferences {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Enable Quiet Hours")).toBeInTheDocument();
    });

    const quietHoursToggle = screen.getByLabelText("Enable Quiet Hours");
    await user.click(quietHoursToggle);

    expect(quietHoursToggle).toBeChecked();

    // Check if time inputs become visible
    await waitFor(() => {
      expect(screen.getByLabelText("Start Time")).toBeInTheDocument();
      expect(screen.getByLabelText("End Time")).toBeInTheDocument();
    });
  });

  it("should update priority filter", async () => {
    const user = userEvent.setup();
    render(<NotificationPreferences {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("medium")).toBeInTheDocument();
    });

    const prioritySelect = screen.getByDisplayValue("medium");
    await user.selectOptions(prioritySelect, "high");

    expect(prioritySelect.value).toBe("high");
  });

  it("should save preferences when clicking save button", async () => {
    const user = userEvent.setup();
    render(<NotificationPreferences {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Save Preferences")).toBeInTheDocument();
    });

    const saveButton = screen.getByText("Save Preferences");
    await user.click(saveButton);

    // Should show success message
    await waitFor(() => {
      expect(
        screen.getByText("Preferences saved successfully!")
      ).toBeInTheDocument();
    });
  });

  it("should test notifications when clicking test button", async () => {
    const user = userEvent.setup();
    render(<NotificationPreferences {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Test Notifications")).toBeInTheDocument();
    });

    const testButton = screen.getByText("Test Notifications");
    await user.click(testButton);

    // Should show test success message
    await waitFor(() => {
      expect(screen.getByText("Test notification sent!")).toBeInTheDocument();
    });
  });

  it("should close modal when clicking close button", async () => {
    const user = userEvent.setup();
    render(<NotificationPreferences {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Close")).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText("Close");
    await user.click(closeButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it("should not render when modal is closed", () => {
    render(<NotificationPreferences {...mockProps} isOpen={false} />);

    expect(
      screen.queryByText("Notification Preferences")
    ).not.toBeInTheDocument();
  });

  it("should handle loading state", () => {
    render(<NotificationPreferences {...mockProps} />);

    // Initially should show loading
    expect(screen.getByText("Loading preferences...")).toBeInTheDocument();
  });

  it("should handle error state", async () => {
    // Mock error response
    vi.mocked(NotificationService).mockImplementationOnce(() => ({
      getUserPreferences: vi
        .fn()
        .mockRejectedValue(new Error("Failed to load")),
      updateUserPreferences: vi.fn(),
      testNotification: vi.fn(),
    }));

    render(<NotificationPreferences {...mockProps} />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load preferences")
      ).toBeInTheDocument();
    });
  });

  it("should validate time inputs for quiet hours", async () => {
    const user = userEvent.setup();
    render(<NotificationPreferences {...mockProps} />);

    // Enable quiet hours first
    await waitFor(() => {
      expect(screen.getByLabelText("Enable Quiet Hours")).toBeInTheDocument();
    });

    const quietHoursToggle = screen.getByLabelText("Enable Quiet Hours");
    await user.click(quietHoursToggle);

    await waitFor(() => {
      expect(screen.getByLabelText("Start Time")).toBeInTheDocument();
    });

    const startTimeInput = screen.getByLabelText("Start Time");
    const endTimeInput = screen.getByLabelText("End Time");

    await user.clear(startTimeInput);
    await user.type(startTimeInput, "23:00");

    await user.clear(endTimeInput);
    await user.type(endTimeInput, "07:00");

    expect(startTimeInput.value).toBe("23:00");
    expect(endTimeInput.value).toBe("07:00");
  });

  it("should show appropriate tooltips for settings", async () => {
    render(<NotificationPreferences {...mockProps} />);

    await waitFor(() => {
      expect(
        screen.getByLabelText("Inventory Low Stock Alerts")
      ).toBeInTheDocument();
    });

    // Hover over info icon (if present) to show tooltip
    const inventoryLabel = screen.getByText("Inventory Low Stock Alerts");
    fireEvent.mouseEnter(inventoryLabel);

    // Should show descriptive text about the feature
    await waitFor(() => {
      expect(
        screen.getByText(/Get notified when inventory levels are running low/)
      ).toBeInTheDocument();
    });
  });
});
