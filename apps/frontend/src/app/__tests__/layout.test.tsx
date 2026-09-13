import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { generateMetadata } from "../layout";

jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn(),
}));

describe("Layout", () => {
  it("should generate metadata with correct translations", async () => {
    const mockTranslations = jest.fn((key: string) => {
      const translations = {
        title: "It's Done - Professional Time Tracking",
        description:
          "A professional time tracking application for contractors and teams",
      };

      return translations[key as keyof typeof translations];
    });

    (getTranslations as unknown as ReturnType<typeof jest.fn>).mockResolvedValue(
      mockTranslations
    );

    const metadata = (await generateMetadata()) as Metadata;

    expect(getTranslations).toHaveBeenCalledWith("app");
    expect(metadata.title).toBe("It's Done - Professional Time Tracking");
    expect(metadata.description).toBe(
      "A professional time tracking application for contractors and teams"
    );

    // Check if metadata has icons property with proper type checking
    const metadataWithIcons = metadata as Metadata & {
      icons?: { icon?: Array<{ url: string; type: string }> };
    };

    expect(metadataWithIcons.icons?.icon).toEqual([
      { url: "/favicon.svg", type: "image/svg+xml" },
    ]);
  });
});
