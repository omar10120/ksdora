import type { Metadata } from 'next'
import { Inter } from 'next/font/google';
import './globals.css'
import { LanguageProvider } from '@/context/LanguageContext'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/context/AuthContext'
import UserOnlyGuard from '@/components/UserOnlyGuard'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pack Your Bags - Bus Booking',
  description: 'Book your bus tickets easily and quickly',
}

export default function RootLayout({
  children

  
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>

    <AuthProvider>
      
          <LanguageProvider>
            <Navbar />
            <main>{children}</main>
            <Footer />
          </LanguageProvider>
      
    </AuthProvider>
      
      </body>
    </html>
  )
}
