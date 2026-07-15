import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/header"
import { DynamicSidebar } from "@/components/dynamic-sidebar"
import { createClient } from "@/lib/supabase/server"
import ProfileProvider from "@/components/profile-provider"
import { ThemeProvider } from "@/lib/theme-provider"
import { ErrorBoundary } from "@/components/error-boundary"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SuriMart - Surigao Marketplace",
  description: "A modern marketplace platform connecting buyers and sellers",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let profile = null
  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = profileData
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider />
        <ProfileProvider user={user} profile={profile}>
          <div className="min-h-screen flex flex-col">
            <Header />
            <div className="flex flex-1">
              <DynamicSidebar />
              <main className="flex-1 lg:ml-16 pt-16 transition-all duration-300">
                {children}
              </main>
            </div>
          </div>
          <Toaster />
        </ProfileProvider>
      </body>
    </html>
  )
}

