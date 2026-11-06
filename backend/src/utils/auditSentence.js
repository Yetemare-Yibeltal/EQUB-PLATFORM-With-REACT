import { formatMoney } from "./formatCurrency";

export const describeAudit = (entry, t) => {
  const data = entry.metadata ?? {};
  const name = entry.subjectName ?? t("a member");

  switch (entry.action) {
    case "draw.performed":
      return t("Cycle {cycle} draw: the winner is {name}.", {
        cycle: data.cycleNumber ?? "",
        name,
      });
    case "payout.paid":
      return t(
        "Payout of {amount} to {name} for cycle {cycle}. Reference {reference}.",
        {
          amount: formatMoney(data.amount ?? 0),
          name,
          cycle: data.cycleNumber ?? "",
          reference: data.reference || "—",
        },
      );
    case "payment_proof.reviewed":
      return data.decision === "approved"
        ? t("Approved {amount} from {name}. Reference {reference}.", {
            amount: formatMoney(data.amountPaid ?? 0),
            name,
            reference: data.reference || "—",
          })
        : t(
            "Rejected the proof from {name}. Reference {reference}. Reason: {reason}",
            {
              name,
              reference: data.reference || "—",
              reason: data.reason || "—",
            },
          );
    case "user.status_changed":
      return t("Changed the account status of {name} from {from} to {to}.", {
        name,
        from: data.from ?? "",
        to: data.to ?? "",
      });
    case "user.role_changed":
      return t("Changed the role of {name} from {from} to {to}.", {
        name,
        from: data.from ?? "",
        to: data.to ?? "",
      });
    case "dispute.decided":
      return t("Decided a dispute.");
    default:
      return null;
  }
};
