import Uses from "@/components/custom/Uses/uses";
import { unstable_setRequestLocale } from "next-intl/server";

type Props = {
  params: { locale: string };
};

const Page: React.FC<Props> = ({ params: { locale } }: Props) => {
  unstable_setRequestLocale(locale);
  return <Uses />;
};

export default Page;
