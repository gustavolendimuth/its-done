import React from "react";
import { render, screen } from "@testing-library/react";
import { InfoCard } from "../info-card";
import { Clock } from "lucide-react";

describe("InfoCard", () => {
  const defaultProps = {
    title: "Test Info Card",
    description: "This is a test description for the info card component.",
  };

  it("renders title and description", () => {
    render(<InfoCard {...defaultProps} />);

    expect(screen.getByText("Test Info Card")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This is a test description for the info card component."
      )
    ).toBeInTheDocument();
  });

  it("renders the Info icon by default", () => {
    render(<InfoCard {...defaultProps} />);

    // Should have SVG element (Info icon)
    const svgElements = document.querySelectorAll("svg");

    expect(svgElements.length).toBe(1); // Only the Info icon
  });

  it("ignores the icon prop and always uses Info icon", () => {
    render(<InfoCard {...defaultProps} icon={Clock} />);

    // Should still only have one SVG element (Info icon)
    const svgElements = document.querySelectorAll("svg");

    expect(svgElements.length).toBe(1);
  });

  it("applies correct variant styles", () => {
    const { container, rerender } = render(
      <InfoCard {...defaultProps} variant="success" />
    );

    const card = container.querySelector('[class*="bg-green"]');

    expect(card).toBeInTheDocument();

    rerender(<InfoCard {...defaultProps} variant="warning" />);
    const warningCard = container.querySelector('[class*="bg-yellow"]');

    expect(warningCard).toBeInTheDocument();

    rerender(<InfoCard {...defaultProps} variant="error" />);
    const errorCard = container.querySelector('[class*="bg-red"]');

    expect(errorCard).toBeInTheDocument();
  });

  it("applies default info variant when no variant provided", () => {
    const { container } = render(<InfoCard {...defaultProps} />);

    // Should have the default info variant classes
    const card = container.querySelector('[class*="bg-primary"]');

    expect(card).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <InfoCard {...defaultProps} className="custom-test-class" />
    );

    expect(container.firstChild).toHaveClass("custom-test-class");
  });

  it("does not have relative positioning anymore", () => {
    const { container } = render(<InfoCard {...defaultProps} />);

    expect(container.firstChild).not.toHaveClass("relative");
  });

  it("renders content without extra padding for icon indicator", () => {
    render(<InfoCard {...defaultProps} />);

    // The content should not have right padding anymore
    const contentDiv = document.querySelector('[class*="pr-8"]');

    expect(contentDiv).not.toBeInTheDocument();
  });
});
