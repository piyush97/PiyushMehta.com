import React from "react";
import { Helmet } from "react-helmet";
import {
  Layout,
  LayoutHeader,
  LayoutMain,
  LayoutFooter,
} from "../components/Layout";
import { GlobalStyle } from "../components/GlobalStyle";
import { ThemeInitializer } from "../components/Theme";
import { AppNavbar } from "./AppNavbar";
import { AppFooter } from "./AppFooter";

export function AppLayout({ children }) {
  return (
    <ThemeInitializer>
      <Helmet>
        <html lang="en" />
        <link rel="alternate" hrefLang="en" href={`https://piyushmehta.com`} />
      </Helmet>
      <Layout>
        <GlobalStyle />
        <LayoutHeader>
          <AppNavbar />
        </LayoutHeader>
        <LayoutMain>{children}</LayoutMain>
        <LayoutFooter>
          <AppFooter />
        </LayoutFooter>
      </Layout>
    </ThemeInitializer>
  );
}
