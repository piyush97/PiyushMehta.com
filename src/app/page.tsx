import { unstable_setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

type Props = {
  params: { locale: string };
};
// This page only renders when the app is built statically (output: 'export')
export default function RootPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);

  redirect("/en");
}
