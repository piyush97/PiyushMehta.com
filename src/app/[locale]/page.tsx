import Hero from "@/components/custom/Home/Hero/hero";
import { unstable_setRequestLocale } from "next-intl/server";

export default function Index({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  return <Hero />;
}
