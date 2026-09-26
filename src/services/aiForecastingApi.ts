import apiClient from "@/lib/axios";
import { ApiError } from "@/lib/ApiError";
import type {
  AnalyticsAiRiskPredictionDto,
  AnalyticsRiskItem,
} from "@/types/analytics";
import type { User } from "@/types/auth";

const aiForecastingRoles: User["role"][] = [
  "ADMIN",
  "MANAGEMENT",
  "FINANCE",
  "ACCOUNTANT",
];

export function canRunAiForecasting(role: User["role"] | undefined) {
  return role ? aiForecastingRoles.includes(role) : false;
}

export async function getProjectRiskPrediction(
  projectId: string,
): Promise<AnalyticsAiRiskPredictionDto> {
  const response = await apiClient.get<AnalyticsAiRiskPredictionDto>(
    `/ai-forecasting/projects/${projectId}/risk`,
  );
  return response.data;
}

export function mapPredictionToRiskItem(
  prediction: AnalyticsAiRiskPredictionDto,
): AnalyticsRiskItem {
  return {
    id: prediction.projectId,
    projectName: prediction.projectName,
    category: "AI Forecast Prediction",
    confidence: Math.round(prediction.confidenceScore * 100),
    summary: prediction.explanation,
    factors: [
      `Payment risk: ${prediction.paymentDelayRisk.toLowerCase()}`,
      `Milestone risk: ${prediction.milestoneDelayRisk.toLowerCase()}`,
      `Revenue: ${prediction.revenueTrend.toLowerCase()}`,
    ],
    level: prediction.projectRiskLevel,
  };
}

export function getAiPredictionErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) {
    return error instanceof Error
      ? error.message
      : "AI analysis could not be completed right now.";
  }
  if (error.statusCode === 403) {
    return "Your role does not have permission to run AI forecasting.";
  }
  if (error.code === "PROJECT_NOT_FOUND") {
    return "The selected project could not be found.";
  }
  if (error.statusCode === 502) {
    return "AI forecasting is temporarily unavailable. Try again later.";
  }
  return error.message;
}
