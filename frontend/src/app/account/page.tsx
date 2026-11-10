import { Suspense } from "react";
import { AccountForm } from "@/components/account-form";

export const metadata = {
  title: "Mi cuenta | Patagonia Sports",
};

export default function AccountPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="h-[520px] w-full max-w-md animate-pulse rounded-3xl bg-slate-200" />
        }
      >
        <AccountForm />
      </Suspense>
    </div>
  );
}
