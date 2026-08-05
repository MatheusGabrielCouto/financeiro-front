import type { Metadata } from "next"
import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
})

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Financeiro | Dívidas",
  description: "Dashboard segura para acompanhamento de dívidas",
}

const RootLayout = ({ children }: LayoutProps<"/">) => {
  return (
    <html
      lang="pt-BR"
      className={`${plusJakarta.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  )
}

export default RootLayout
