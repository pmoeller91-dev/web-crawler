import { describe, it, expect } from "@jest/globals";
import { printReport } from "./report.js";
import type { PagesMap } from "./crawl.js";

describe("printReport", () => {
  it("should print a nicely formatted report with pages in descending order", () => {
    const pages: PagesMap = new Map();
    pages.set("yahoo.com", 10);
    pages.set("google.com", 100);
    pages.set("bing.com", 50);
    const report = printReport(pages);
    expect(report).toMatchSnapshot();
    expect(report.indexOf("google.com")).toBeLessThan(report.indexOf("bing.com"));
    expect(report.indexOf("bing.com")).toBeLessThan(report.indexOf("yahoo.com"));
  });
});
