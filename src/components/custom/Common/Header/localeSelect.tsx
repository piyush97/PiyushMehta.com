// Destructure the imports for cleaner code
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { usePathname, useRouter } from "@/navigation";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useTransition } from "react";

// Define the type of the props outside the component for better readability
type LocaleSelectProps = {
  defaultValue: string;
  label: string;
};

const LocaleSelect: React.FC<LocaleSelectProps> = ({ defaultValue, label }) => {
  const t = useTranslations("LocaleSwitcher");
  const [isPending, startTransition] = useTransition(); // Explicitly use React.useTransition
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();

  // Define the type of the event for better type safety
  const onSelectChange = (event: string) => {
    const nextLocale = event;
    startTransition(() => {
      router.replace(pathname, { ...params, locale: nextLocale });
    });
  };

  return (
    <Select onValueChange={onSelectChange}>
      <SelectTrigger
        className="w-[180px] border-gray-200  rounded shadow-sm  text-gray-900  dark:text-gray-100"
        disabled={isPending}
      >
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent className="border-gray-200 rounded shadow-sm ">
        <SelectGroup>
          <SelectItem key={"en"} value={"en"}>
            🇺🇸 English
          </SelectItem>
          <SelectItem key={"ca-fr"} value={"ca-fr"}>
            🇨🇦 Canadian French
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default LocaleSelect;
