import Link from "next/link";
import { policyLink } from "./PolicyPage";

export function GooglePrivacyNotice() {
  return (
    <p className="mt-3 text-xs leading-relaxed text-muted">
      Google shares basic account details with FungiBd for sign-in. <Link href="/privacy" className={policyLink}>Privacy Policy</Link> · <Link href="/terms" className={policyLink}>Terms of Service</Link>
    </p>
  );
}
