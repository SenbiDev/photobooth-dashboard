import "./globals.css";
import type { Metadata } from "next";
import { AppProviders } from "../components/providers/app-providers";

export const metadata: Metadata = {
  title: "Lil Photobooth / Edge Console",
  description: "Runtime configuration for the Our Lil Photobooth edge fleet.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
