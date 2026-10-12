import test from "node:test";
import assert from "node:assert/strict";
import * as aiApi from "../.coverage-build/aiForecastingApi.mjs";
import { ApiError } from "../.coverage-build/apiErrorMock.mjs";
import {
  calls,
  resetApiMock,
  setGetHandler,
} from "../.coverage-build/axiosMock.mjs";

const prediction = {
  projectId: "p1",
  projectName: "North site",
  projectRiskLevel: "HIGH",
  paymentDelayRisk: "MEDIUM",
  milestoneDelayRisk: "HIGH",
  revenueTrend: "DECLINING",
  explanation: "Several milestones are late.",
  recommendedAction: "Re-plan the schedule.",
  predictionSource: "SAFE_FALLBACK",
  sufficientData: false,
  confidenceScore: 0.72,
  warnings: ["Insufficient history"],
  generatedAt: "2026-10-12T00:00:00.000Z",
};

test("AI forecasting is available only to approved roles", () => {
  for (const role of ["ADMIN", "MANAGEMENT", "FINANCE", "ACCOUNTANT"]) {
    assert.equal(aiApi.canRunAiForecasting(role), true, role);
  }
  for (const role of [
    "USER",
    "SALES_MANAGER",
    "CLIENT_PORTAL_USER",
    undefined,
  ]) {
    assert.equal(aiApi.canRunAiForecasting(role), false, String(role));
  }
});

test("AI forecasting calls the selected project's risk endpoint", async () => {
  resetApiMock();
  setGetHandler(async () => ({ data: prediction }));
  assert.equal(await aiApi.getProjectRiskPrediction("p1"), prediction);
  assert.equal(calls[0].url, "/ai-forecasting/projects/p1/risk");
});

test("AI forecast DTO maps to a dashboard risk card without dropping recommendations", () => {
  const item = aiApi.mapPredictionToRiskItem(prediction);
  assert.equal(item.id, "p1");
  assert.equal(item.projectName, "North site");
  assert.equal(item.category, "AI Forecast Prediction");
  assert.equal(item.confidence, 72);
  assert.match(item.summary, /milestones are late/);
  assert.deepEqual(item.factors, [
    "Payment risk: medium",
    "Milestone risk: high",
    "Revenue: declining",
  ]);
});

test("AI forecast errors give users actionable messages", () => {
  assert.match(
    aiApi.getAiPredictionErrorMessage(new ApiError("forbidden", 403)),
    /does not have permission/,
  );
  assert.match(
    aiApi.getAiPredictionErrorMessage(
      new ApiError("missing", 404, "PROJECT_NOT_FOUND"),
    ),
    /could not be found/,
  );
  assert.match(
    aiApi.getAiPredictionErrorMessage(new ApiError("down", 502)),
    /temporarily unavailable/,
  );
  assert.equal(
    aiApi.getAiPredictionErrorMessage(new ApiError("other", 400)),
    "other",
  );
  assert.equal(
    aiApi.getAiPredictionErrorMessage(new Error("network down")),
    "network down",
  );
  assert.match(
    aiApi.getAiPredictionErrorMessage(null),
    /could not be completed/,
  );
});
