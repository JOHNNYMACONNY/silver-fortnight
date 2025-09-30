#!/usr/bin/env npx tsx

/**
 * Deployment Configuration Verification Script
 *
 * Verifies that all deployment configurations are correct and consistent
 * across different deployment platforms and workflows.
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";

interface DeploymentIssue {
  type: "error" | "warning" | "info";
  category: string;
  message: string;
  fix?: string;
}

class DeploymentVerifier {
  private issues: DeploymentIssue[] = [];
  private rootDir: string;

  constructor() {
    this.rootDir = process.cwd();
  }

  private addIssue(
    type: DeploymentIssue["type"],
    category: string,
    message: string,
    fix?: string
  ) {
    this.issues.push({ type, category, message, fix });
  }

  private readJsonFile(path: string): Record<string, unknown> | null {
    try {
      const fullPath = join(this.rootDir, path);
      if (!existsSync(fullPath)) {
        this.addIssue("error", "Missing Files", `File not found: ${path}`);
        return null;
      }
      return JSON.parse(readFileSync(fullPath, "utf-8"));
    } catch (error) {
      this.addIssue(
        "error",
        "File Parsing",
        `Failed to parse ${path}: ${error}`
      );
      return null;
    }
  }

  private readTextFile(path: string): string | null {
    try {
      const fullPath = join(this.rootDir, path);
      if (!existsSync(fullPath)) {
        this.addIssue("error", "Missing Files", `File not found: ${path}`);
        return null;
      }
      return readFileSync(fullPath, "utf-8");
    } catch (error) {
      this.addIssue(
        "error",
        "File Reading",
        `Failed to read ${path}: ${error}`
      );
      return null;
    }
  }

  verifyPackageJsonScripts() {
    console.log("🔍 Verifying package.json scripts...");

    const packageJson = this.readJsonFile("package.json");
    if (!packageJson) return;

    const requiredScripts = [
      "build:ci",
      "test:ci",
      "build",
      "dev",
      "type-check",
      "lint",
    ];

    const scripts = packageJson.scripts || {};

    for (const script of requiredScripts) {
      if (!scripts[script]) {
        this.addIssue(
          "error",
          "Missing Scripts",
          `Missing required script: ${script}`,
          `Add "${script}" script to package.json`
        );
      } else {
        this.addIssue("info", "Scripts", `✅ Script found: ${script}`);
      }
    }

    // Check for CI-specific optimizations
    if (scripts["build:ci"] && !scripts["build:ci"].includes("build:fast")) {
      this.addIssue(
        "info",
        "Performance",
        "build:ci could use functions:build:fast for faster CI builds"
      );
    }
  }

  verifyFirebaseConfig() {
    console.log("🔍 Verifying Firebase configuration...");

    const firebaseJson = this.readJsonFile("firebase.json");
    if (!firebaseJson) return;

    // Check hosting configuration
    if (!firebaseJson.hosting) {
      this.addIssue(
        "error",
        "Firebase Config",
        "Missing hosting configuration in firebase.json"
      );
      return;
    }

    const hosting = firebaseJson.hosting;

    if (hosting.public !== "dist") {
      this.addIssue(
        "warning",
        "Firebase Config",
        `Hosting public directory is "${hosting.public}", expected "dist"`
      );
    }

    if (
      !hosting.rewrites ||
      !hosting.rewrites.some(
        (r: Record<string, unknown>) =>
          r.source === "**" && r.destination === "/index.html"
      )
    ) {
      this.addIssue(
        "error",
        "Firebase Config",
        "Missing SPA rewrite rule in firebase.json hosting configuration"
      );
    }

    // Check functions configuration
    if (firebaseJson.functions) {
      if (firebaseJson.functions.runtime !== "nodejs18") {
        this.addIssue(
          "warning",
          "Firebase Config",
          `Functions runtime is "${firebaseJson.functions.runtime}", consider updating to nodejs18`
        );
      }
    }

    this.addIssue(
      "info",
      "Firebase Config",
      "✅ Firebase configuration looks good"
    );
  }

  verifyGitHubWorkflows() {
    console.log("🔍 Verifying GitHub Actions workflows...");

    const workflows = [
      ".github/workflows/deploy.yml",
      ".github/workflows/ci-cd.yml",
    ];

    for (const workflow of workflows) {
      const content = this.readTextFile(workflow);
      if (!content) continue;

      // Check for consistent project IDs
      const projectIdMatches = content.match(/projectId:\s*([^\s\n]+)/g);
      if (projectIdMatches) {
        const projectIds = projectIdMatches.map((match) =>
          match.split(":")[1].trim()
        );
        const uniqueProjectIds = [...new Set(projectIds)];

        if (uniqueProjectIds.length > 1) {
          this.addIssue(
            "error",
            "Workflow Config",
            `Inconsistent project IDs in ${workflow}: ${uniqueProjectIds.join(
              ", "
            )}`,
            "Ensure all workflows use the same project ID: tradeya-45ede"
          );
        } else if (uniqueProjectIds[0] === "tradeya-45ede") {
          this.addIssue(
            "info",
            "Workflow Config",
            `✅ Correct project ID in ${workflow}`
          );
        }
      }

      // Check for required secrets
      if (content.includes("FIREBASE_SERVICE_ACCOUNT")) {
        this.addIssue(
          "info",
          "Workflow Config",
          `✅ ${workflow} references FIREBASE_SERVICE_ACCOUNT secret`
        );
      }

      // Check for consistent action versions
      const checkoutVersions = content.match(/actions\/checkout@v\d+/g);
      const nodeVersions = content.match(/actions\/setup-node@v\d+/g);

      if (checkoutVersions && new Set(checkoutVersions).size > 1) {
        this.addIssue(
          "warning",
          "Workflow Config",
          `Inconsistent checkout action versions in ${workflow}: ${[
            ...new Set(checkoutVersions),
          ].join(", ")}`
        );
      }

      if (nodeVersions && new Set(nodeVersions).size > 1) {
        this.addIssue(
          "warning",
          "Workflow Config",
          `Inconsistent Node.js setup versions in ${workflow}: ${[
            ...new Set(nodeVersions),
          ].join(", ")}`
        );
      }
    }
  }

  verifyVercelConfig() {
    console.log("🔍 Verifying Vercel configuration...");

    const vercelJson = this.readJsonFile("vercel.json");
    if (!vercelJson) return;

    if (vercelJson.buildCommand !== "npm run build:ci") {
      this.addIssue(
        "warning",
        "Vercel Config",
        `Build command is "${vercelJson.buildCommand}", expected "npm run build:ci"`
      );
    }

    if (vercelJson.outputDirectory !== "dist") {
      this.addIssue(
        "warning",
        "Vercel Config",
        `Output directory is "${vercelJson.outputDirectory}", expected "dist"`
      );
    }

    this.addIssue(
      "info",
      "Vercel Config",
      "✅ Vercel configuration looks good"
    );
  }

  verifyEnvironmentFiles() {
    console.log("🔍 Verifying environment configuration...");

    const envFiles = [".env.example", ".env.local.example"];

    for (const envFile of envFiles) {
      if (existsSync(join(this.rootDir, envFile))) {
        this.addIssue("info", "Environment", `✅ Found ${envFile}`);
      } else {
        this.addIssue(
          "warning",
          "Environment",
          `Missing ${envFile} - consider adding for documentation`
        );
      }
    }
  }

  generateReport() {
    console.log("\n📊 DEPLOYMENT CONFIGURATION REPORT\n");

    const errorCount = this.issues.filter((i) => i.type === "error").length;
    const warningCount = this.issues.filter((i) => i.type === "warning").length;
    const infoCount = this.issues.filter((i) => i.type === "info").length;

    console.log(`🔴 Errors: ${errorCount}`);
    console.log(`🟡 Warnings: ${warningCount}`);
    console.log(`🔵 Info: ${infoCount}\n`);

    const categories = [...new Set(this.issues.map((i) => i.category))];

    for (const category of categories) {
      const categoryIssues = this.issues.filter((i) => i.category === category);
      console.log(`\n📁 ${category}:`);

      for (const issue of categoryIssues) {
        const icon =
          issue.type === "error"
            ? "❌"
            : issue.type === "warning"
            ? "⚠️"
            : "ℹ️";
        console.log(`  ${icon} ${issue.message}`);
        if (issue.fix) {
          console.log(`     💡 Fix: ${issue.fix}`);
        }
      }
    }

    if (errorCount === 0) {
      console.log("\n🎉 No critical deployment issues found!");
      console.log("✅ Deployment configuration is ready for production.");
    } else {
      console.log("\n🚨 Critical issues found that may prevent deployment.");
      console.log("Please fix the errors above before deploying.");
    }

    return errorCount === 0;
  }

  async run() {
    console.log("🚀 TradeYa Deployment Configuration Verifier\n");

    this.verifyPackageJsonScripts();
    this.verifyFirebaseConfig();
    this.verifyGitHubWorkflows();
    this.verifyVercelConfig();
    this.verifyEnvironmentFiles();

    const isReady = this.generateReport();

    process.exit(isReady ? 0 : 1);
  }
}

// Run the verifier
const verifier = new DeploymentVerifier();
verifier.run().catch(console.error);
