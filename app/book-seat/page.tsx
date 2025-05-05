'use client'

import Image from "next/image"
import SearchForm from "@/components/SearchForm"
import { useLanguage } from "@/context/LanguageContext"
import ProtectedRoute from "@/components/ProtectedRoute"
import UserOnlyGuard from '@/components/UserOnlyGuard'
import busHero from '@/public/images/bus-hero.png'

export default function BookSeat() {
  const { language, translations } = useLanguage()

  const features = [
    {
      icon: "🎫",
      title: translations.bookSeat.features.easyBooking.title,
      description: translations.bookSeat.features.easyBooking.description
    },
    {
      icon: "🚌",
      title: translations.bookSeat.features.comfortableTravel.title,
      description: translations.bookSeat.features.comfortableTravel.description
    },
    {
      icon: "💰",
      title: translations.bookSeat.features.bestPrices.title,
      description: translations.bookSeat.features.bestPrices.description
    }
  ]

  const popularRoutes = [
    "الرياض → جدة",
    "مكة → المدينة",
    "الدمام → الرياض",
    "جدة → مكة",
    "الطائف → جدة",
    "المدينة → مكة"
  ]


  const Content = () => (

    
    <div className={`min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 ${language === 'ar' ? 'rtl' : 'ltr'} text-black`}>
      {/* Hero Section */}
      <section className="relative h-[500px] flex items-center">
        <div className="absolute inset-0 z-0">
          <Image
            src={busHero}
            alt={translations.bookSeat.hero.imageAlt}
            fill
            className="object-cover brightness-50"
            priority
          />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center text-white">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            {translations.bookSeat.hero.title}
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            {translations.bookSeat.hero.subtitle}
          </p>
        </div>
      </section>

      {/* Search Section */}
      <section className="max-w-4xl mx-auto px-4 -mt-16 relative z-20">
        <div className="bg-white rounded-xl shadow-xl p-6">
          <SearchForm />
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-black">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow text-center"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Routes Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 text-black">
          <h2 className="text-3xl font-bold text-center mb-12">
            {translations.bookSeat.popularRoutes.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(language === 'ar' ? popularRoutes : [
              "New York → Boston",
              "Los Angeles → San Francisco",
              "Chicago → Detroit",
              "Miami → Orlando",
              "Seattle → Portland",
              "Houston → Austin"
            ]).map((route, index) => (
              <div 
                key={index}
                className="bg-white rounded-lg p-4 shadow hover:shadow-md transition-shadow cursor-pointer"
              >
                <p className="text-lg font-medium text-center">{route}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )

  return (
    <UserOnlyGuard>
        <ProtectedRoute>
          <Content />
        </ProtectedRoute>
    </UserOnlyGuard>
  )
}
