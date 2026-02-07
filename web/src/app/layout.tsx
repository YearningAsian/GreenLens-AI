import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { StateProvider } from "@/context/StateContext";

export const metadata: Metadata = {
  title: "GreenLens AI | National Non-Profit",
  description: "AI-powered construction waste classification — a national non-profit initiative piloting across Georgia & Tennessee.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ConvexClientProvider>
          <StateProvider>{children}</StateProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
