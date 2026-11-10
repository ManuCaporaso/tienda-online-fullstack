import { redirect } from "next/navigation";

export const metadata = {
  title: "Mis pedidos | Patagonia Sports",
};

export default function DashboardPage() {
  redirect("/profile");
}
