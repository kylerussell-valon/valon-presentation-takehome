import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Valon Presentation Takehome",
  description: "A rough starter for building image-first slides."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
