import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import type { AdminConsoleFeedback } from "./admin-console-shared";

type AdminConsoleFeedbackBannerProps = {
  feedback: AdminConsoleFeedback | null;
};

export function AdminConsoleFeedbackBanner({
  feedback,
}: AdminConsoleFeedbackBannerProps) {
  if (!feedback) {
    return null;
  }

  const Icon =
    feedback.variant === "error" ? CircleAlertIcon : CircleCheckIcon;

  return (
    <Alert
      variant={feedback.variant === "error" ? "destructive" : "default"}
      className="border-slate-200 bg-white text-slate-900"
    >
      <Icon className="size-4" />
      <AlertTitle>{feedback.title}</AlertTitle>
      <AlertDescription>{feedback.message}</AlertDescription>
    </Alert>
  );
}
