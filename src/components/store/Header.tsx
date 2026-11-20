import { getSettings } from "@/lib/settings";
import { getCustomer } from "@/lib/auth";
import { HeaderBar } from "./HeaderBar";

export async function Header() {
  const [s, customer] = await Promise.all([getSettings(), getCustomer()]);
  return (
    <>
      {s.home.announcement && (
        <div className="bg-brand text-white">
          <p className="container-x flex h-9 items-center justify-center truncate font-bangla text-[13px]">{s.home.announcement}</p>
        </div>
      )}
      <HeaderBar customerName={customer?.name ?? null} />
    </>
  );
}
