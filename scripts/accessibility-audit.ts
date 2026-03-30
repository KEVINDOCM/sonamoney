// Accessibility Audit Script using axe-core
// Run with: npx tsx scripts/accessibility-audit.ts

import { chromium } from "playwright";
import axe from "axe-core";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const routes = [
  "/",
  "/login",
  "/dashboard",
  "/transactions",
  "/categories",
  "/budget",
  "/calendar",
  "/goals",
  "/analytics",
  "/settings",
];

async function runAudit() {
  console.log("🔍 Starting accessibility audit...\n");
  
  const browser = await chromium.launch();
  const results: Array<{ route: string; violations: typeof axe.AxeResults.violations }> = [];
  
  for (const route of routes) {
    const page = await browser.newPage();
    try {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
      
      // Inject axe-core
      await page.addScriptTag({ path: require.resolve("axe-core") });
      
      // Run axe
      const auditResults = await page.evaluate(() => {
        return new Promise((resolve) => {
          
          axe.run((err: Error, results: typeof axe.AxeResults) => {
            if (err) resolve({ violations: [] });
            resolve(results);
          });
        });
      });
      
      const typedResults = auditResults as typeof axe.AxeResults;
      results.push({ route, violations: typedResults.violations });
      
      if (typedResults.violations.length > 0) {
        console.log(`❌ ${route}: ${typedResults.violations.length} violations`);
        typedResults.violations.forEach((v) => {
          console.log(`   - ${v.impact?.toUpperCase()}: ${v.description}`);
          console.log(`     Nodes: ${v.nodes.length}`);
        });
      } else {
        console.log(`✅ ${route}: No violations`);
      }
    } catch (error) {
      console.log(`⚠️  ${route}: Error running audit - ${error}`);
    } finally {
      await page.close();
    }
  }
  
  await browser.close();
  
  // Summary
  const totalViolations = results.reduce((sum, r) => sum + r.violations.length, 0);
  console.log(`\n📊 Summary: ${totalViolations} violations across ${routes.length} routes`);
  
  process.exit(totalViolations > 0 ? 1 : 0);
}

runAudit();
