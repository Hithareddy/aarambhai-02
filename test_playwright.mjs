import { chromium } from 'playwright';

async function main() {
  console.log("Testing Chromium launch...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("http://localhost:8082/login");
  const title = await page.title();
  console.log("Page Title:", title);
  await browser.close();
  console.log("Chromium launch successful!");
}

main().catch(err => {
  console.error("Chromium test error:", err);
  process.exit(1);
});
