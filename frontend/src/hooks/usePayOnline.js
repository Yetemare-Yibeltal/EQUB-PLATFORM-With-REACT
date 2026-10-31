import { useCallback, useState } from "react";
import { paymentService } from "../services/paymentService";
import { getErrorMessage } from "../utils/errors";
import { useLanguage } from "./useLanguage";

export function usePayOnline() {
  const { t } = useLanguage();
  const [payingId, setPayingId] = useState(null);
  const [error, setError] = useState("");

  const pay = useCallback(
    async (contribution) => {
      const groupId =
        typeof contribution.group === "object"
          ? contribution.group.id
          : contribution.group;

      setPayingId(contribution.id);
      setError("");

      try {
        const payment = await paymentService.checkout({
          groupId,
          contributionId: contribution.id,
        });

        if (!payment.checkoutUrl) {
          throw new Error(t("Missing checkout address"));
        }

        window.location.assign(payment.checkoutUrl);
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            t("Could not start the payment, please try again"),
          ),
        );
        setPayingId(null);
      }
    },
    [t],
  );

  return { pay, payingId, error };
}
