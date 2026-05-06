import { redirect } from "next/navigation";
import { readMeta } from "@/lib/reports";

export default async function HomePage() {
  const meta = await readMeta();
  const tip = meta.tip ?? 0;
  redirect(`/v${tip}`);
}
