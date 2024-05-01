import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { locales } from "@/config";
import { useLocale, useTranslations } from "next-intl";
import { useParams, usePathname } from "next/navigation";
import router from "next/router";
import { ChangeEvent, useTransition } from "react";

type Props = {
  defaultValue: string;
  label: string;
};

const LocaleSelect = ({ defaultValue, label }: Props) => {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const params = useParams();

  function onSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value;
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- TypeScript will validate that only known `params`
        // are used in combination with a given `pathname`. Since the two will
        // always match for the current route, we can skip runtime checks.
        { pathname, params },
        { locale: nextLocale }
      );
    });
  }

  return (
    <Select defaultValue={defaultValue}>
      <SelectTrigger
        className="w-[180px]"
        disabled={isPending}
        defaultValue={defaultValue}
      >
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent onChange={onSelectChange}>
        {locales.map((cur) => (
          <SelectItem key={cur} value={cur}>
            {t("locale", { locale: cur })}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LocaleSelect;
