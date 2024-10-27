import Footer from "@/components/custom/Common/Footer/footer";
import Header from "@/components/custom/Common/Header/header";
import { locales } from "@/config";
import { cn } from "@/lib/utils";
import { Metadata } from "next";
import { NextIntlClientProvider, useMessages } from "next-intl";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import { Inter as FontSans } from "next/font/google";
import { ReactNode } from "react";
import "./globals.css";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});
type Props = {
  children: ReactNode;
  params: { locale: string };
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// #region Metadata for locale based layout
export async function generateMetadata({
  params: { locale },
}: Omit<Props, "children">) {
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const metadata: Metadata = {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
  };
  return metadata;
}

// #region Local Layout for locale
export default function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const messages = useMessages();
  return (
    <html lang={locale}>
      <head>
        <meta
          property="og:image"
          content={`/${locale}/api/og?title=Piyush Mehta`}
        />
      </head>
      <body
        className={cn(
          " bg-background font-sans antialiased dark:bg-black min-h-[100dvh]",
          fontSans.variable
        )}
      >
        <ThemeProvider
          defaultTheme="dark-classic"
          enableColorScheme
          themes={[
            "light",
            "dark-classic",
            "tangerine",
            "dark-tangerine",
            "mint",
            "dark-mint",
          ]}
        >
          <NextIntlClientProvider messages={messages}>
            <div className="flex flex-col min-h-[100dvh]">
              <Header />
              <main className="container">{children}</main>
              <Footer />
            </div>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
