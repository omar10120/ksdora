'use client'

import Image from "next/image"
import { useLanguage } from "@/context/LanguageContext"
import Link from "next/link"
import UserOnlyGuard from '@/components/UserOnlyGuard'
import busHero from '@/public/images/bus-hero.png'

export default function Home() {
  const { language, translations } = useLanguage()

  return (
    <UserOnlyGuard>

    
      <div className={`min-h-screen ${language === 'ar' ? 'rtl' : 'ltr'}`}>
        {/* Hero Section */}
        <section className="relative h-screen flex items-center">
          <div className="absolute inset-0 z-0">
            <Image
              src={busHero}
              alt={translations.home.hero.imageAlt}
              fill
              className="object-cover brightness-50"
              priority
            />
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 text-center text-white">
            <h1 className="text-6xl md:text-8xl font-bold mb-8 animate-fade-in">
              {translations.home.hero.title}
            </h1>
            <p className="text-2xl mb-12 max-w-3xl mx-auto animate-fade-in delay-200">
              {translations.home.hero.subtitle}
            </p>
            <div className="flex justify-center gap-6 animate-fade-in delay-300">
              <Link 
                href="/trips" 
                className="px-8 py-4 bg-blue-600 text-white rounded-lg text-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                {translations.home.hero.exploreButton}
              </Link>
              <Link 
                href="/book-seat" 
                className="px-8 py-4 bg-white text-blue-600 rounded-lg text-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                {translations.home.hero.bookButton}
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              {[
                { number: "500+", label: translations.home.stats.cities },
                { number: "1M+", label: translations.home.stats.customers },
                { number: "24/7", label: translations.home.stats.support }
              ].map((stat, index) => (
                <div key={index} className="animate-fade-in">
                  <div className="text-5xl font-bold text-blue-600 mb-2">{stat.number}</div>
                  <div className="text-xl text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-blue-600 py-32">
          <div className="max-w-4xl mx-auto px-4 text-center text-white">
            <h2 className="text-4xl font-bold mb-6 animate-fade-in">
              {translations.home.cta.title}
            </h2>
            <p className="text-xl mb-12 animate-fade-in delay-100">
              {translations.home.cta.description}
            </p>
            <Link 
              href="/trips"
              className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg text-xl font-semibold hover:bg-gray-100 transition-colors animate-fade-in delay-200"
            >
              {translations.home.cta.button}
            </Link>
          </div>
        </section>
      </div>
    </UserOnlyGuard>
  )
}
