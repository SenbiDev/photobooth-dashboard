import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lil Photobooth / Edge Console",
  description: "Runtime configuration for the Our Lil Photobooth edge fleet.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
