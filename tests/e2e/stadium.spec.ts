import { test, expect } from '@playwright/test';

test.describe('AegisAI StadiumOS — Core End-to-End Operational Validation', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the deployment URL or local port 3000
    await page.goto('/');
  });

  // STEP 1: Watch a zone climb toward red (Congestion monitoring)
  test('should display live-updating digital twin map overlays and reflect elevated crowd levels', async ({ page }) => {
    // Locate the central digital twin container
    const digitalTwinMap = page.locator('#digital-twin-map-container');
    await expect(digitalTwinMap).toBeVisible();

    // Verify presence of interactive map layers (Heatmap, Gates, Facilities)
    const layerToggles = page.locator('.map-layer-toggle');
    await expect(layerToggles.first()).toBeVisible();

    // Confirm that Gate B's glowing congestion beacon is visible and styled as high/congested (red/amber)
    const gateBBeacon = page.locator('[id="map-beacon-gate-B"]');
    await expect(gateBBeacon).toBeVisible();
    await expect(gateBBeacon).toHaveClass(/text-amber-400|text-red-500|bg-amber-950|bg-red-950/);
  });

  // STEP 2: See the resulting alert with reasoning
  test('should display the predictive decision banner proposing SOP-aligned recommendations with clear metrics and reasoning', async ({ page }) => {
    // The active prescriptive recommendations card
    const decisionBanner = page.locator('#active-ai-decision-banner');
    await expect(decisionBanner).toBeVisible();

    // Confirm presence of the metric improvement forecasting (e.g. ↓ Wait Time or Flow Rate)
    const metricImprovement = decisionBanner.locator('.forecasted-metric-pill');
    await expect(metricImprovement.first()).toBeVisible();

    // Verify presence of the action trigger buttons (e.g., Approve / Authorize / Dismiss)
    const approveBtn = decisionBanner.locator('button:has-text("AUTHORIZE"), button:has-text("APPROVE")');
    await expect(approveBtn).toBeVisible();

    // Click "Authorize" to test the closed-loop state update triggers
    await approveBtn.click();
    
    // Check if the timeline/logs panel logs the authorized action instantly
    const actionLog = page.locator('#tactical-timeline-logs-panel');
    await expect(actionLog).toContainText(/AUTHORIZE|Applied|Optimized|Rerout/i);
  });

  // STEP 3: Ask the Fan Agent a question and get a state-consistent answer
  test('should support interactive chats with the Fan Agent and receive context-consistent routing suggestions', async ({ page }) => {
    // Switch role or agent selector tab to Fan Companion
    const fanTabBtn = page.locator('#role-tab-fan, button:has-text("Fan Companion")');
    await expect(fanTabBtn).toBeVisible();
    await fanTabBtn.click();

    // Ensure Fan Companion agent control panel is rendered active
    const fanPanel = page.locator('#agent-control-panel-fan');
    await expect(fanPanel).toBeVisible();

    // Type query regarding Gate congestion or wait-times
    const chatInput = page.locator('#agent-chat-input-field');
    await chatInput.fill('Which gate has the shortest wait times right now?');
    
    // Click Send
    const sendBtn = page.locator('#agent-chat-send-button');
    await sendBtn.click();

    // Expect agent response to contain state-grounded data (e.g., mention Gate C or normal status)
    const chatResponse = page.locator('.agent-message-bubble').last();
    await expect(chatResponse).toBeVisible({ timeout: 10000 });
    await expect(chatResponse).toContainText(/Gate/i);
  });

  // STEP 4: Ask the Volunteer screen a policy question and get a cited answer
  test('should support querying official RAG playbook manuals and receive precise cited responses referencing FIFA rules', async ({ page }) => {
    // Open the Grounded Blueprint Documents or Volunteer FAQ sidebar
    const docSheetToggle = page.locator('#doc-sheet-toggle-btn, button:has-text("Blueprint Docs")');
    await expect(docSheetToggle).toBeVisible();
    await docSheetToggle.click();

    // Check that the RAG Playbook Search bar is active
    const searchInput = page.locator('#playbook-rag-search-input');
    await expect(searchInput).toBeVisible();

    // Ask a heat stress policy query
    await searchInput.fill('What is the protocol for solar heat exhaustion or heat stress?');
    await searchInput.press('Enter');

    // Confirm that the retrieved response references Article 7.3 and volunteer hydration squads
    const ragResponseText = page.locator('#playbook-rag-response-results');
    await expect(ragResponseText).toBeVisible({ timeout: 10000 });
    await expect(ragResponseText).toContainText(/Article 7.3|hydration/i);
  });
});
