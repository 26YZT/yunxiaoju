import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import { PRODUCT_NAME, PRODUCT_DESCRIPTION } from '@/config/brand';
import "./globals.css";

export const metadata: Metadata = {
  title: `${PRODUCT_NAME} · AI 短剧创作工作室`,
  description: PRODUCT_DESCRIPTION,
  applicationName: PRODUCT_NAME,
  icons: { icon: '/brand/cloud-icon.svg', apple: '/brand/cloud-icon.svg' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className="antialiased"
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
