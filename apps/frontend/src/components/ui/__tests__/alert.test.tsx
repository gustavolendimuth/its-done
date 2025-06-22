import { render, screen } from "@testing-library/react";
import { Alert, AlertTitle, AlertDescription } from "../alert";

describe("Alert Component", () => {
  test("renders alert with default variant", () => {
    render(
      <Alert>
        <AlertTitle>Test Title</AlertTitle>
        <AlertDescription>Test Description</AlertDescription>
      </Alert>
    );

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveClass("bg-background", "text-foreground");
  });

  test("renders alert with destructive variant", () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Error Title</AlertTitle>
        <AlertDescription>Error Description</AlertDescription>
      </Alert>
    );

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveClass("border-destructive/50", "text-destructive");
  });

  test("renders alert title correctly", () => {
    render(
      <Alert>
        <AlertTitle>Test Alert Title</AlertTitle>
      </Alert>
    );

    const title = screen.getByText("Test Alert Title");
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe("H5");
  });

  test("renders alert description correctly", () => {
    render(
      <Alert>
        <AlertDescription>Test Alert Description</AlertDescription>
      </Alert>
    );

    const description = screen.getByText("Test Alert Description");
    expect(description).toBeInTheDocument();
  });

  test("applies custom className", () => {
    render(
      <Alert className="custom-class">
        <AlertDescription>Test</AlertDescription>
      </Alert>
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("custom-class");
  });

  test("supports all accessibility attributes", () => {
    render(
      <Alert data-testid="test-alert" aria-label="Test alert">
        <AlertDescription>Accessible alert</AlertDescription>
      </Alert>
    );

    const alert = screen.getByTestId("test-alert");
    expect(alert).toHaveAttribute("role", "alert");
    expect(alert).toHaveAttribute("aria-label", "Test alert");
  });
});
