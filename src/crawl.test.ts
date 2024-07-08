import { describe, it, expect } from "@jest/globals";
import { normalizeURL } from "./crawl.ts";

describe("normalizeURL", () => {
  it.each(["https", "http", "ftp", "smtp", "nonsense"])(
    "should remove any protocol (%s)",
    (protocol) => {
      const url = `${protocol}://google.com`;
      const expectedUrl = "google.com";
      const normalizedUrl = normalizeURL(url);
      expect(normalizedUrl).toEqual(expectedUrl);
    },
  );
  it("should remove query strings", () => {
    const url = "https://yahoo.com/search?q=abc";
    const expectedUrl = "yahoo.com/search";
    const normalizedUrl = normalizeURL(url);
    expect(normalizedUrl).toEqual(expectedUrl);
  });
  it("should deal with relative paths", () => {
    const url = "https://google.com/search/deeper/../";
    const expectedUrl = "google.com/search";
    const normalizedUrl = normalizeURL(url);
    expect(normalizedUrl).toEqual(expectedUrl);
  });
  it("should remove a single trailing slash", () => {
    const url = "https://google.com";
    const expectedUrl = "google.com";
    const normalizedUrl = normalizeURL(url);
    expect(normalizedUrl).toEqual(expectedUrl);
  });
});
