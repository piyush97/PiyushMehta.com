import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { SwatchBook } from "lucide-react";
import { useTheme } from "next-themes";
import { twc } from "react-twc";

const ThemeSelect = () => {
  const { theme, setTheme, themes } = useTheme();

  const onSelectChange = (value: string) => {
    console.log(value);
    setTheme(value);
  };
  const RenderColor = twc.div<{ themeName: string }>`
  w-4 h-4 rounded-full mr-2
  ${(props) => (props.themeName === "dark" ? "bg-black" : "bg-white")}
`;
  if (!theme) return null;
  return (
    <Select onValueChange={onSelectChange} defaultValue={theme}>
      <SelectTrigger className="px-1 border-none bg-transparent font-primary">
        <SwatchBook className="text-primary" />
      </SelectTrigger>
      <SelectContent className="border-gray-200 rounded shadow-sm font-primary">
        <SelectGroup>
          {themes.map((themeName) => (
            <SelectItem key={themeName} value={themeName}>
              <RenderColor themeName={themeName} />
              {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default ThemeSelect;
