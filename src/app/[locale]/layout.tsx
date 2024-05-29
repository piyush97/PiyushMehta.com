import Footer from "@/components/custom/Common/Footer/footer";
import Header from "@/components/custom/Common/Header/header";
import { Separator } from "@/components/ui/separator";
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
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider messages={messages}>
            <Header />
            <Separator className="sticky" />
            <main> {children}</main>
            <Footer />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
