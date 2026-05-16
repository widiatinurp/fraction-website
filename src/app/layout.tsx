import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fraction Adventure",
  description:
    "A playful bilingual fraction game for 2nd grade students to learn one-half and one-fourth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
