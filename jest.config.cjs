/** @type {import('jest').Config} */
const config = {
  extensionsToTreatAsEsm: [".ts"],
  moduleFileExtensions: ["js", "json", "ts"],
  resolver: "ts-jest-resolver",
};

module.exports = config;
