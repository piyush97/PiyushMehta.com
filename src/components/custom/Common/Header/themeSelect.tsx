import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const ThemeSelect = () => {
  const { theme, setTheme, themes } = useTheme();

  const onSelectChange = (value: string) => {
    setTheme(value);
  };

  const renderIcon = (themeName: string) => {
    switch (themeName) {
      case "dark":
        return <Moon className="mr-2" />;
      case "light":
      default:
        return <Sun className="mr-2" />;
    }
  };

  return (
    <Select onValueChange={onSelectChange} defaultValue={theme}>
      <SelectTrigger className="px-1 border-none">
        {renderIcon(theme)}
      </SelectTrigger>
      <SelectContent className="border-gray-200 rounded shadow-sm">
        <SelectGroup>
          {themes.map((themeName) => (
            <SelectItem key={themeName} value={themeName}>
              {renderIcon(themeName)}{" "}
              {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default ThemeSelect;
