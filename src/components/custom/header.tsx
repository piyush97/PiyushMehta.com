import {
  Menubar,
  MenubarLabel,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import React from "react";

function Header(): React.ReactNode {
  return (
    <header className="sticky top-0 z-50 w-full">
      <Menubar className="container flex h-14 max-w-screen-2xl items-center">
        <MenubarLabel>Piyush Mehta</MenubarLabel>
        <MenubarMenu>
          <MenubarTrigger>About Me</MenubarTrigger>
          <MenubarTrigger>Blog</MenubarTrigger>
        </MenubarMenu>
      </Menubar>
    </header>
  );
}

export default Header;
