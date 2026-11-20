import { ResetForm } from "../AuthForms";

export const metadata = { title: "নতুন পাসওয়ার্ড · Reset password", robots: { index: false } };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return (
    <div className="container-x max-w-md py-16">
      <h1 className="font-display text-3xl">নতুন পাসওয়ার্ড দিন</h1>
      <div className="mt-8 rounded-2xl border border-line bg-white p-6">
        <ResetForm token={token} />
      </div>
    </div>
  );
}
