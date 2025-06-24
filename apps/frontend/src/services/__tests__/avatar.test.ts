import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  testAvatarUrl,
  getAvatarMetrics,
  resetAvatarMetrics,
  recordAvatarMetric,
  shouldDisableGravatar,
} from "../avatar";

// Mock Image
global.Image = vi.fn().mockImplementation(() => ({
  onload: null,
  onerror: null,
  src: "",
}));

describe("Avatar Service", () => {
  beforeEach(() => {
    resetAvatarMetrics();
    vi.clearAllMocks();
  });

  describe("testAvatarUrl", () => {
    it("should resolve to true for valid URLs", async () => {
      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: "",
      };

      global.Image = vi.fn().mockImplementation(() => mockImage);

      const testPromise = testAvatarUrl("https://example.com/avatar.jpg", 1000);

      // Simulate successful load
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 10);

      const result = await testPromise;

      expect(result).toBe(true);
    });

    it("should resolve to false for invalid URLs", async () => {
      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: "",
      };

      global.Image = vi.fn().mockImplementation(() => mockImage);

      const testPromise = testAvatarUrl(
        "https://invalid-url.com/avatar.jpg",
        1000
      );

      // Simulate error
      setTimeout(() => {
        if (mockImage.onerror) {
          mockImage.onerror();
        }
      }, 10);

      const result = await testPromise;

      expect(result).toBe(false);
    });

    it("should timeout after specified time", async () => {
      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: "",
      };

      global.Image = vi.fn().mockImplementation(() => mockImage);

      const startTime = Date.now();
      const result = await testAvatarUrl(
        "https://slow-server.com/avatar.jpg",
        100
      );
      const endTime = Date.now();

      expect(result).toBe(false);
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });
  });

  describe("Avatar Metrics", () => {
    it("should start with zero metrics", () => {
      const metrics = getAvatarMetrics();

      expect(metrics.gravatarSuccess).toBe(0);
      expect(metrics.gravatarFails).toBe(0);
      expect(metrics.uiAvatarsSuccess).toBe(0);
      expect(metrics.diceBearSuccess).toBe(0);
      expect(metrics.fallbackUsed).toBe(0);
    });

    it("should record metrics correctly", () => {
      recordAvatarMetric("gravatarSuccess");
      recordAvatarMetric("gravatarFails");
      recordAvatarMetric("uiAvatarsSuccess");

      const metrics = getAvatarMetrics();

      expect(metrics.gravatarSuccess).toBe(1);
      expect(metrics.gravatarFails).toBe(1);
      expect(metrics.uiAvatarsSuccess).toBe(1);
      expect(metrics.diceBearSuccess).toBe(0);
      expect(metrics.fallbackUsed).toBe(0);
    });

    it("should reset metrics correctly", () => {
      recordAvatarMetric("gravatarSuccess");
      recordAvatarMetric("gravatarFails");

      let metrics = getAvatarMetrics();

      expect(metrics.gravatarSuccess).toBe(1);
      expect(metrics.gravatarFails).toBe(1);

      resetAvatarMetrics();

      metrics = getAvatarMetrics();
      expect(metrics.gravatarSuccess).toBe(0);
      expect(metrics.gravatarFails).toBe(0);
    });
  });

  describe("shouldDisableGravatar", () => {
    it("should return false when not enough data", () => {
      expect(shouldDisableGravatar()).toBe(false);
    });

    it("should return false when failure rate is low", () => {
      // Record mostly successful attempts
      for (let i = 0; i < 8; i++) {
        recordAvatarMetric("gravatarSuccess");
      }
      for (let i = 0; i < 2; i++) {
        recordAvatarMetric("gravatarFails");
      }

      expect(shouldDisableGravatar()).toBe(false);
    });

    it("should return true when failure rate is high", () => {
      // Record mostly failed attempts
      for (let i = 0; i < 2; i++) {
        recordAvatarMetric("gravatarSuccess");
      }
      for (let i = 0; i < 8; i++) {
        recordAvatarMetric("gravatarFails");
      }

      expect(shouldDisableGravatar()).toBe(true);
    });
  });
});
