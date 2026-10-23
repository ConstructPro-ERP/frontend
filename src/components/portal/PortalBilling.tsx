import { Receipt } from "lucide-react";
import { PortalPanel } from "./PortalUI";

/**
 * The client-portal API has no invoice or payment routes yet, and the staff
 * finance endpoints are not client-scoped, so nothing is requested here.
 */
export default function PortalBilling() {
  return (
    <div className="space-y-4">
      <PortalPanel
        title="Invoice and payment status"
        description="Billing details for your projects."
      >
        <div className="p-10 text-center">
          <Receipt className="mx-auto mb-3 text-on-surface-muted" size={28} />
          <h3 className="font-semibold text-on-background">
            Not available in the portal yet
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-on-surface-muted">
            Invoice and payment information will appear here once it is
            available for client accounts. Until then, please contact your
            ConstructPro representative for billing questions.
          </p>
        </div>
      </PortalPanel>
    </div>
  );
}
