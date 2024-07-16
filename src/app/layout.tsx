import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import "./globals.css";

// const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "灵活网页组件 - 飞书多维表格仪表盘插件",
  description:
    "嵌入网页任意区域，内容秒变仪表盘组件 https://ejfk-dev.feishu.cn/wiki/RiMAwdhyRiwqPDkJntRcIqKrnhh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
      // className={inter.className}
      >
        {children}
      </body>
    </html>
  );
}
