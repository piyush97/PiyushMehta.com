import Footer from "@/components/custom/Common/Footer/footer";
import Header from "@/components/custom/Common/Header/header";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { VisualEditing } from "next-sanity";
import { ThemeProvider } from "next-themes";
import { Inter as FontSans } from "next/font/google";
import { draftMode } from "next/headers";
import "./globals.css";

/**
 * The sans-serif font to use for the application.
 */
const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

/**
 * Metadata for the application.
 */
export const metadata: Metadata = {
  title: "Piyush Mehta",
  description: "Piyush Mehta's personal website",
};

/**
 * Root layout component for the application.
 *
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to render.
 * @returns {JSX.Element} The rendered root layout.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        {draftMode().isEnabled && (
          <div>
            <a className="p-4 bg-blue-300 block" href="/api/disable-draft">
              Disable preview mode
            </a>
          </div>
        )}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Header />
          <Separator className="sticky" />
          <main> {children}</main>
          {draftMode().isEnabled && <VisualEditing />}

          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
