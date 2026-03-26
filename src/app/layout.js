import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Cybernetic - Advanced Robotics Solutions",
  description:
    "Explore cutting-edge robotics with Cybernetic. Innovative robotic arms, AI automation, and advanced technology for industry and home use.",
  keywords: [
    "Cybernetic",
    "robotics",
    "robotic arms",
    "automation",
    "AI technology",
    "advanced robotics",
  ],
  authors: [{ name: "Cybernetic Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Cybernetic - Advanced Robotics Solutions",
    description:
      "Discover advanced robotic arms and AI automation solutions with Cybernetic.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cybernetic - Advanced Robotics Solutions",
    description:
      "Discover advanced robotic arms and AI automation solutions with Cybernetic.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}