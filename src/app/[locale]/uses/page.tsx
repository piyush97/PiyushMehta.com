import Uses from "@/components/custom/Uses/uses";

type Props = {
  params: { locale: string };
};

const Page: React.FC<Props> = ({ params: { locale } }: Props) => {
  return <Uses />;
};

export default Page;
