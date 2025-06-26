import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { SettingsForm } from "../settings-form";

// Add type definitions for jest-dom
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(className: string): R;
      toHaveValue(value: string | number | string[]): R;
      toBeDisabled(): R;
    }
  }
}

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock sonner
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock settings service
const mockSettings = {
  alertHours: 160,
  notificationEmail: "test@example.com",
};

interface UpdateSettingsOptions {
  onSuccess: () => void;
  onError: (error: Error) => void;
}

const mockUpdateSettings = jest.fn();

jest.mock("@/services/settings", () => ({
  useSettings: jest.fn(() => ({
    data: mockSettings,
    isLoading: false,
    error: null,
  })),
  useUpdateSettings: () => ({
    mutate: mockUpdateSettings,
  }),
}));

describe("SettingsForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render loading state", () => {
    const { useSettings } = require("@/services/settings");
    useSettings.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(<SettingsForm />);

    expect(screen.getByText("loadingSettings")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveClass("animate-spin");
  });

  it("should render error state", () => {
    const { useSettings } = require("@/services/settings");
    useSettings.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error("Test error"),
    });

    render(<SettingsForm />);

    expect(screen.getByText("failedToLoad")).toBeInTheDocument();
  });

  it("should render form with initial values", () => {
    render(<SettingsForm />);

    const alertHoursInput = screen.getByLabelText("alertHoursThreshold");
    const emailInput = screen.getByLabelText("notificationEmail");

    expect(alertHoursInput).toHaveValue(160);
    expect(emailInput).toHaveValue("test@example.com");
  });

  it("should validate alert hours input", async () => {
    render(<SettingsForm />);

    const alertHoursInput = screen.getByLabelText("alertHoursThreshold");
    const submitButton = screen.getByRole("button", { name: "save" });

    // Test minimum value
    fireEvent.change(alertHoursInput, { target: { value: "0" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Alert hours must be at least 1")
      ).toBeInTheDocument();
    });

    // Test maximum value
    fireEvent.change(alertHoursInput, { target: { value: "1001" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Alert hours must be at most 1000")
      ).toBeInTheDocument();
    });

    // Test valid value
    fireEvent.change(alertHoursInput, { target: { value: "180" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith(
        {
          alertHours: 180,
          notificationEmail: "test@example.com",
        },
        expect.any(Object)
      );
    });
  });

  it("should validate email input", async () => {
    render(<SettingsForm />);

    const emailInput = screen.getByLabelText("notificationEmail");
    const submitButton = screen.getByRole("button", { name: "save" });

    // Test invalid email
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid email address")).toBeInTheDocument();
    });

    // Test valid email
    fireEvent.change(emailInput, { target: { value: "new@example.com" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith(
        {
          alertHours: 160,
          notificationEmail: "new@example.com",
        },
        expect.any(Object)
      );
    });

    // Test empty email (optional)
    fireEvent.change(emailInput, { target: { value: "" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith(
        {
          alertHours: 160,
          notificationEmail: undefined,
        },
        expect.any(Object)
      );
    });
  });

  it("should show success message on successful update", async () => {
    const { toast } = require("sonner");
    mockUpdateSettings.mockImplementation(
      (data, options: UpdateSettingsOptions) => {
        options.onSuccess();
      }
    );

    render(<SettingsForm />);

    const alertHoursInput = screen.getByLabelText("alertHoursThreshold");
    fireEvent.change(alertHoursInput, { target: { value: "180" } });

    const submitButton = screen.getByRole("button", { name: "save" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("settingsUpdatedSuccessfully");
    });
  });

  it("should show error message on update failure", async () => {
    const { toast } = require("sonner");
    const testError = new Error("Test error");
    mockUpdateSettings.mockImplementation(
      (data, options: UpdateSettingsOptions) => {
        options.onError(testError);
      }
    );

    render(<SettingsForm />);

    const alertHoursInput = screen.getByLabelText("alertHoursThreshold");
    fireEvent.change(alertHoursInput, { target: { value: "180" } });

    const submitButton = screen.getByRole("button", { name: "save" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Test error");
    });
  });

  it("should disable submit button when form is pristine", () => {
    render(<SettingsForm />);

    const submitButton = screen.getByRole("button", { name: "save" });
    expect(submitButton).toBeDisabled();
  });

  it("should show unsaved changes message when form is dirty", () => {
    render(<SettingsForm />);

    const alertHoursInput = screen.getByLabelText("alertHoursThreshold");
    fireEvent.change(alertHoursInput, { target: { value: "180" } });

    expect(screen.getByText("unsavedChanges")).toBeInTheDocument();
  });

  it("should disable form inputs while submitting", async () => {
    render(<SettingsForm />);

    const alertHoursInput = screen.getByLabelText("alertHoursThreshold");
    const emailInput = screen.getByLabelText("notificationEmail");
    const submitButton = screen.getByRole("button", { name: "save" });

    fireEvent.change(alertHoursInput, { target: { value: "180" } });
    fireEvent.click(submitButton);

    expect(alertHoursInput).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
    expect(screen.getByText("loading")).toBeInTheDocument();
  });
});
