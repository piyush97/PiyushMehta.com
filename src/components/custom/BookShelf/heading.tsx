type Props = {
  title: string;
  subtitle: string;
};

const Heading = ({ title, subtitle }: Props) => {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-bold tracking-tighter md:text-3xl">
        {title}
      </h2>
      <p className="text-gray-500 dark:text-gray-400">{subtitle}</p>
    </div>
  );
};

export default Heading;
