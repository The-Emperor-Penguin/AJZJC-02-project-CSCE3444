const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};