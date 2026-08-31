export default async function globalTeardown() {
  try {
    await fetch('http://127.0.0.1:4321/__qa_shutdown__');
  } catch {
    // The server may already have been stopped by Playwright.
  }
}
