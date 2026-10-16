import { useCallback, useState } from "react";
import { paymentService } from "../services/paymentService";
import { getErrorMessage } from "../utils/errors";

export function usePayOnline() {
  const [payingId, setPayingId] = useState(null);
  const [error, setError] = useState("");

  const pay = useCallback(async (contribution) => {
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
        throw new Error("Missing checkout address");
      }

      window.location.assign(payment.checkoutUrl);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Could not start the payment, please try again",
        ),
      );
      setPayingId(null);
    }
  }, []);

  return { pay, payingId, error };
}
