"use client";
import { useActionState } from "react";
import { BellRing } from "lucide-react";
import { subscribeHarvestAction, type FormState } from "@/app/(store)/actions";
import { FormMessage, Honeypot, SubmitButton } from "@/components/ui/form";

export function HarvestAlertForm({ dark = false, interest = "New harvest alerts" }: { dark?: boolean; interest?: string }) {
  const [state, action] = useActionState<FormState, FormData>(subscribeHarvestAction, {});
  if (state.ok)
    return (
      <div className={dark ? "rounded-2xl bg-cream/10 p-4 text-cream" : ""}>
        <FormMessage state={state} />
      </div>
    );
  return (
    <form action={action} className="flex flex-col gap-2">
      <Honeypot />
      <input type="hidden" name="interest" value={interest} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="harvest-contact">
          Email or phone
        </label>
        <input id="harvest-contact" name="contact" required placeholder="ইমেইল বা মোবাইল নম্বর · Email or phone" className="input h-12 flex-1 px-4" />
        <SubmitButton className={dark ? "btn-cream h-12" : "h-12"}>
          <BellRing className="h-4 w-4" /> জানিয়ে দিন
        </SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
