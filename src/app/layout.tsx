import MainLayout from "@/components/MainLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "BarrelBets",
    template: "%s | BarrelBets",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
