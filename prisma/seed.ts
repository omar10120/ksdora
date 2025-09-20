import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Seed Countries
  console.log('📍 Seeding countries...')
  const syria = await prisma.country.create({
    data: {
      name: 'Syria',
      nameAr: 'سوريا',
      code: 'SY'
    }
  })

  const lebanon = await prisma.country.create({
    data: {
      name: 'Lebanon',
      nameAr: 'لبنان',
      code: 'LB'
    }
  })

  const jordan = await prisma.country.create({
    data: {
      name: 'Jordan',
      nameAr: 'الأردن',
      code: 'JO'
    }
  })

  const turkey = await prisma.country.create({
    data: {
      name: 'Turkey',
      nameAr: 'تركيا',
      code: 'TR'
    }
  })

  // Seed Cities
  console.log('🏙️ Seeding cities...')
  const damascus = await prisma.city.create({
    data: {
      name: 'Damascus',
      nameAr: 'دمشق',
      countryId: syria.id
    }
  })

  const aleppo = await prisma.city.create({
    data: {
      name: 'Aleppo',
      nameAr: 'حلب',
      countryId: syria.id
    }
  })

  const homs = await prisma.city.create({
    data: {
      name: 'Homs',
      nameAr: 'حمص',
      countryId: syria.id
    }
  })

  const latakia = await prisma.city.create({
    data: {
      name: 'Latakia',
      nameAr: 'اللاذقية',
      countryId: syria.id
    }
  })

  const beirut = await prisma.city.create({
    data: {
      name: 'Beirut',
      nameAr: 'بيروت',
      countryId: lebanon.id
    }
  })

  const amman = await prisma.city.create({
    data: {
      name: 'Amman',
      nameAr: 'عمان',
      countryId: jordan.id
    }
  })

  const istanbul = await prisma.city.create({
    data: {
      name: 'Istanbul',
      nameAr: 'إسطنبول',
      countryId: turkey.id
    }
  })

  // Seed Routes
  console.log('🛣️ Seeding routes...')
  const routes = await Promise.all([
    prisma.route.create({
      data: {
        departureCityId: damascus.id,
        arrivalCityId: aleppo.id,
        distance: 355.5
      }
    }),
    prisma.route.create({
      data: {
        departureCityId: damascus.id,
        arrivalCityId: homs.id,
        distance: 162.0
      }
    }),
    prisma.route.create({
      data: {
        departureCityId: damascus.id,
        arrivalCityId: latakia.id,
        distance: 186.0
      }
    }),
    prisma.route.create({
      data: {
        departureCityId: damascus.id,
        arrivalCityId: beirut.id,
        distance: 85.0
      }
    }),
    prisma.route.create({
      data: {
        departureCityId: damascus.id,
        arrivalCityId: amman.id,
        distance: 180.0
      }
    }),
    prisma.route.create({
      data: {
        departureCityId: damascus.id,
        arrivalCityId: istanbul.id,
        distance: 1200.0
      }
    })
  ])

  // Seed Buses
  console.log('🚌 Seeding buses...')
  const buses = await Promise.all([
    prisma.bus.create({
      data: {
        plateNumber: 'SY-12345',
        capacity: 45,
        model: 'Mercedes O500',
        status: 'active'
      }
    }),
    prisma.bus.create({
      data: {
        plateNumber: 'SY-67890',
        capacity: 35,
        model: 'Isuzu NPR',
        status: 'active'
      }
    }),
    prisma.bus.create({
      data: {
        plateNumber: 'SY-11111',
        capacity: 50,
        model: 'Volvo B7R',
        status: 'active'
      }
    }),
    prisma.bus.create({
      data: {
        plateNumber: 'SY-22222',
        capacity: 40,
        model: 'Scania K-series',
        status: 'maintenance'
      }
    })
  ])

  // Seed Trips
  console.log('🚗 Seeding trips...')
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const trips = await Promise.all([
    prisma.trip.create({
      data: {
        routeId: routes[0].id, // Damascus to Aleppo
        busId: buses[0].id,
        departureTime: new Date(tomorrow.getTime() + 8 * 60 * 60 * 1000), // 8 AM tomorrow
        arrivalTime: new Date(tomorrow.getTime() + 14 * 60 * 60 * 1000), // 2 PM tomorrow
        lastBookingTime: new Date(tomorrow.getTime() + 6 * 60 * 60 * 1000), // 6 AM tomorrow
        price: 2500.00,
        status: 'scheduled',
        titleAr: 'رحلة دمشق - حلب',
        titleEn: 'Damascus - Aleppo Trip',
        descriptionAr: 'رحلة مريحة من دمشق إلى حلب',
        descriptionEn: 'Comfortable trip from Damascus to Aleppo',
        longitude: 36.2765,
        latitude: 33.5138,
        primaryImage: 'https://example.com/damascus-aleppo-primary.jpg'
      }
    }),
    prisma.trip.create({
      data: {
        routeId: routes[1].id, // Damascus to Homs
        busId: buses[1].id,
        departureTime: new Date(tomorrow.getTime() + 10 * 60 * 60 * 1000), // 10 AM tomorrow
        arrivalTime: new Date(tomorrow.getTime() + 12 * 60 * 60 * 1000), // 12 PM tomorrow
        lastBookingTime: new Date(tomorrow.getTime() + 8 * 60 * 60 * 1000), // 8 AM tomorrow
        price: 1200.00,
        status: 'scheduled',
        titleAr: 'رحلة دمشق - حمص',
        titleEn: 'Damascus - Homs Trip',
        descriptionAr: 'رحلة سريعة من دمشق إلى حمص',
        descriptionEn: 'Quick trip from Damascus to Homs',
        longitude: 36.7139,
        latitude: 34.7333,
        primaryImage: 'https://example.com/damascus-homs-primary.jpg'
      }
    }),
    prisma.trip.create({
      data: {
        routeId: routes[3].id, // Damascus to Beirut
        busId: buses[2].id,
        departureTime: new Date(nextWeek.getTime() + 9 * 60 * 60 * 1000), // 9 AM next week
        arrivalTime: new Date(nextWeek.getTime() + 11 * 60 * 60 * 1000), // 11 AM next week
        lastBookingTime: new Date(nextWeek.getTime() + 7 * 60 * 60 * 1000), // 7 AM next week
        price: 3500.00,
        status: 'scheduled',
        titleAr: 'رحلة دمشق - بيروت',
        titleEn: 'Damascus - Beirut Trip',
        descriptionAr: 'رحلة دولية من دمشق إلى بيروت',
        descriptionEn: 'International trip from Damascus to Beirut',
        longitude: 35.5018,
        latitude: 33.8938,
        primaryImage: 'https://res.cloudinary.com/dvo4hzzpk/image/upload/v1758310811/trips/r2kesf3sts8rxzhhsu0z.jpg'
      }
    })
  ])

  // Seed Trip Images
  console.log('🖼️ Seeding trip images...')
  const images = [
    {
      tripId: trips[0].id, // Damascus to Aleppo
      imageUrl: 'https://res.cloudinary.com/dvo4hzzpk/image/upload/v1758310811/trips/r2kesf3sts8rxzhhsu0z.jpg',
      altText: 'Damascus to Aleppo trip image'
    },
    {
      tripId: trips[1].id, // Damascus to Homs
      imageUrl: 'https://res.cloudinary.com/dvo4hzzpk/image/upload/v1758310811/trips/r2kesf3sts8rxzhhsu0z.jpg',
      altText: 'Damascus to Homs trip image'
    },
    {
      tripId: trips[2].id, // Damascus to Beirut
      imageUrl: 'https://res.cloudinary.com/dvo4hzzpk/image/upload/v1758310811/trips/r2kesf3sts8rxzhhsu0z.jpg',
      altText: 'Damascus to Beirut trip image'
    }
  ]

  await Promise.all(
    images.map(imageData =>
      prisma.images.create({
        data: imageData
      })
    )
  )

  // Seed Seats for each trip
  console.log('💺 Seeding seats...')
  for (const trip of trips) {
    const bus = buses.find(b => b.id === trip.busId)
    if (bus) {
      for (let i = 1; i <= bus.capacity; i++) {
        await prisma.seat.create({
          data: {
            tripId: trip.id,
            seatNumber: i.toString(),
            status: Math.random() > 0.3 ? 'available' : 'booked' // 70% available, 30% booked
          }
        })
      }
    }
  }

  // Seed Admin User
  console.log('👤 Seeding admin user...')
  const existingAdmin = await prisma.user.findFirst({
    where: {
      email: 'admin@kzdora.com'
    }
  })

  if (!existingAdmin) {
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123"
    const hashedPassword = await bcrypt.hash(adminPassword, 10)
    
    await prisma.user.create({
      data: {
        email: 'admin@kzdora.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: true,
        phone: '+96399596071'
      }
    })
    console.log('✅ Admin user created successfully')
  } else {
    console.log('ℹ️ Admin user already exists')
  }

  // Seed Sample User
  console.log('👤 Seeding sample user...')
  const existingUser = await prisma.user.findFirst({
    where: {
      email: 'user@example.com'
    }
  })

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash('user123', 10)
    
    const sampleUser = await prisma.user.create({
      data: {
        email: 'user@example.com',
        name: 'Sample User',
        password: hashedPassword,
        role: 'USER',
        emailVerified: true,
        phone: '+963123456789'
      }
    })
    console.log('✅ Sample user created successfully')

    // Seed Bookings
    console.log('📋 Seeding bookings...')
    
    // Get some seats for booking
    const availableSeats = await prisma.seat.findMany({
      where: {
        tripId: trips[0].id,
        status: 'available'
      },
      take: 3
    })

    if (availableSeats.length >= 2) {
      // Create a booking for the first trip
      const booking = await prisma.booking.create({
        data: {
          userId: sampleUser.id,
          tripId: trips[0].id,
          totalPrice: 5000.00, // 2 seats * 2500
          status: 'confirmed'
        }
      })

      // Create booking details for 2 seats
      await Promise.all([
        prisma.bookingDetail.create({
          data: {
            bookingId: booking.id,
            seatId: availableSeats[0].id,
            price: 2500.00
          }
        }),
        prisma.bookingDetail.create({
          data: {
            bookingId: booking.id,
            seatId: availableSeats[1].id,
            price: 2500.00
          }
        })
      ])

      // Update seat status to booked
      await Promise.all([
        prisma.seat.update({
          where: { id: availableSeats[0].id },
          data: { status: 'booked' }
        }),
        prisma.seat.update({
          where: { id: availableSeats[1].id },
          data: { status: 'booked' }
        })
      ])

      console.log('✅ Booking created successfully')

      // Create rating and feedback for the first booking
      await prisma.rating.create({
        data: {
          bookingId: booking.id,
          userId: sampleUser.id,
          tripId: trips[0].id,
          rating: 5 // 5-star rating
        }
      })

      await prisma.feedback.create({
        data: {
          bookingId: booking.id,
          userId: sampleUser.id,
          tripId: trips[0].id,
          message: 'رحلة ممتازة ومريحة جداً. السائق محترف والخدمة ممتازة. أنصح الجميع بهذه الشركة.'
        }
      })
    }

    // Create another booking for the second trip
    const moreSeats = await prisma.seat.findMany({
      where: {
        tripId: trips[1].id,
        status: 'available'
      },
      take: 1
    })

    if (moreSeats.length >= 1) {
      const booking2 = await prisma.booking.create({
        data: {
          userId: sampleUser.id,
          tripId: trips[1].id,
          totalPrice: 1200.00,
          status: 'pending'
        }
      })

      await prisma.bookingDetail.create({
        data: {
          bookingId: booking2.id,
          seatId: moreSeats[0].id,
          price: 1200.00
        }
      })

      await prisma.seat.update({
        where: { id: moreSeats[0].id },
        data: { status: 'booked' }
      })

      console.log('✅ Second booking created successfully')

      // Create rating and feedback for the second booking
      await prisma.rating.create({
        data: {
          bookingId: booking2.id,
          userId: sampleUser.id,
          tripId: trips[1].id,
          rating: 4 // 4-star rating
        }
      })

      await prisma.feedback.create({
        data: {
          bookingId: booking2.id,
          userId: sampleUser.id,
          tripId: trips[1].id,
          message: 'رحلة جيدة بشكل عام. الحافلة نظيفة والسائق محترف.'
        }
      })
    }

    // Create another user for more diverse ratings
    const secondUser = await prisma.user.create({
      data: {
        email: 'user2@example.com',
        name: 'Second User',
        password: await bcrypt.hash('user123', 10),
        role: 'USER',
        emailVerified: true,
        phone: '+963987654321'
      }
    })

    // Create a booking for the second user
    const moreAvailableSeats = await prisma.seat.findMany({
      where: {
        tripId: trips[2].id, // Damascus to Beirut
        status: 'available'
      },
      take: 1
    })

    if (moreAvailableSeats.length >= 1) {
      const booking3 = await prisma.booking.create({
        data: {
          userId: secondUser.id,
          tripId: trips[2].id,
          totalPrice: 3500.00,
          status: 'completed'
        }
      })

      await prisma.bookingDetail.create({
        data: {
          bookingId: booking3.id,
          seatId: moreAvailableSeats[0].id,
          price: 3500.00
        }
      })

      await prisma.seat.update({
        where: { id: moreAvailableSeats[0].id },
        data: { status: 'booked' }
      })

      // Create rating for the second trip (different rating)
      await prisma.rating.create({
        data: {
          bookingId: booking3.id,
          userId: secondUser.id,
          tripId: trips[2].id,
          rating: 4 // 4-star rating
        }
      })

      // Create feedback for the second trip
      await prisma.feedback.create({
        data: {
          bookingId: booking3.id,
          userId: secondUser.id,
          tripId: trips[2].id,
          message: 'The trip was good overall. The bus was clean and the driver was professional. However, there was a slight delay in departure.'
        }
      })

      console.log('✅ Second user booking and feedback created successfully')
    }

    // Create a third user with a lower rating
    const thirdUser = await prisma.user.create({
      data: {
        email: 'user3@example.com',
        name: 'Third User',
        password: await bcrypt.hash('user123', 10),
        role: 'USER',
        emailVerified: true,
        phone: '+963555666777'
      }
    })

    // Create another booking for the third user
    const evenMoreSeats = await prisma.seat.findMany({
      where: {
        tripId: trips[1].id, // Damascus to Homs
        status: 'available'
      },
      take: 1
    })

    if (evenMoreSeats.length >= 1) {
      const booking4 = await prisma.booking.create({
        data: {
          userId: thirdUser.id,
          tripId: trips[1].id,
          totalPrice: 1200.00,
          status: 'completed'
        }
      })

      await prisma.bookingDetail.create({
        data: {
          bookingId: booking4.id,
          seatId: evenMoreSeats[0].id,
          price: 1200.00
        }
      })

      await prisma.seat.update({
        where: { id: evenMoreSeats[0].id },
        data: { status: 'booked' }
      })

      // Create a lower rating for the third trip
      await prisma.rating.create({
        data: {
          bookingId: booking4.id,
          userId: thirdUser.id,
          tripId: trips[1].id,
          rating: 3 // 3-star rating
        }
      })

      // Create feedback for the third trip
      await prisma.feedback.create({
        data: {
          bookingId: booking4.id,
          userId: thirdUser.id,
          tripId: trips[1].id,
          message: 'الرحلة مقبولة ولكن يمكن تحسين الخدمة. الحافلة تحتاج إلى صيانة أفضل.'
        }
      })

             console.log('✅ Third user booking and feedback created successfully')
     }

     // Seed Bills and Payments
     console.log('💰 Seeding bills and payments...')

     // Create bills for existing bookings
     const allBookings = await prisma.booking.findMany({
       where: {
         userId: {
           in: [sampleUser.id, secondUser.id, thirdUser.id]
         }
       }
     })

     for (const booking of allBookings) {
       // Create a bill for each booking
       const bill = await prisma.bill.create({
         data: {
           bookingId: booking.id,
           amount: booking.totalPrice,
           status: booking.status === 'confirmed' ? 'paid' : 
                  booking.status === 'completed' ? 'paid' : 'unpaid'
         }
       })

       // Create payments for paid bills
       if (bill.status === 'paid') {
         await prisma.payment.create({
           data: {
             billId: bill.id,
             amount: bill.amount,
             method: 'cash',
             status: 'successful',
             receiptImage: 'https://res.cloudinary.com/dvo4hzzpk/image/upload/v1757787538/receipts/receipt_1757787535902.jpg',
             transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
             paidAt: new Date()
           }
         })
  } else {
         // Create pending payment for unpaid bills
         await prisma.payment.create({
           data: {
             billId: bill.id,
             amount: bill.amount,
             receiptImage: 'https://res.cloudinary.com/dvo4hzzpk/image/upload/v1757787538/receipts/receipt_1757787535902.jpg',
             method: 'online_payment',
             status: 'pending',
             transactionId: null
           }
         })
       }
     }

     // Create additional bills with different payment methods
     const additionalUser = await prisma.user.create({
       data: {
         email: 'user4@example.com',
         name: 'Fourth User',
         password: await bcrypt.hash('user123', 10),
         role: 'USER',
         emailVerified: true,
         phone: '+963777888999'
       }
     })

     // Create a booking for the fourth user
     const additionalSeats = await prisma.seat.findMany({
       where: {
         tripId: trips[0].id, // Damascus to Aleppo
         status: 'available'
       },
       take: 1
     })

     if (additionalSeats.length >= 1) {
       const booking5 = await prisma.booking.create({
         data: {
           userId: additionalUser.id,
           tripId: trips[0].id,
           totalPrice: 2500.00,
           status: 'confirmed'
         }
       })

       await prisma.bookingDetail.create({
         data: {
           bookingId: booking5.id,
           seatId: additionalSeats[0].id,
           price: 2500.00
         }
       })

       await prisma.seat.update({
         where: { id: additionalSeats[0].id },
         data: { status: 'booked' }
       })

       // Create bill with company payment method
       const bill5 = await prisma.bill.create({
         data: {
           bookingId: booking5.id,
           amount: 2500.00,
           status: 'paid'
         }
       })

       await prisma.payment.create({
         data: {
           billId: bill5.id,
           amount: 2500.00,
           method: 'online_payment',
           receiptImage: 'https://res.cloudinary.com/dvo4hzzpk/image/upload/v1757787538/receipts/receipt_1757787535902.jpg',
           status: 'successful',
           transactionId: `TXN-ALHARAM-${Date.now()}`,
           paidAt: new Date()
         }
       })

       console.log('✅ Fourth user booking with company payment created successfully')
     }

     // Create a cancelled booking with cancelled bill
     const cancelledUser = await prisma.user.create({
       data: {
         email: 'user5@example.com',
         name: 'Cancelled User',
         password: await bcrypt.hash('user123', 10),
         role: 'USER',
         emailVerified: true,
         phone: '+963111222333'
       }
     })

     const cancelledSeats = await prisma.seat.findMany({
       where: {
         tripId: trips[2].id, // Damascus to Beirut
         status: 'available'
       },
       take: 1
     })

     if (cancelledSeats.length >= 1) {
       const booking6 = await prisma.booking.create({
         data: {
           userId: cancelledUser.id,
           tripId: trips[2].id,
           totalPrice: 3500.00,
           status: 'cancelled'
         }
       })

       await prisma.bookingDetail.create({
         data: {
           bookingId: booking6.id,
           seatId: cancelledSeats[0].id,
           price: 3500.00
         }
       })

       await prisma.seat.update({
         where: { id: cancelledSeats[0].id },
         data: { status: 'booked' }
       })

       // Create cancelled bill
       const bill6 = await prisma.bill.create({
         data: {
           bookingId: booking6.id,
           amount: 3500.00,
           status: 'cancelled'
         }
       })

       await prisma.payment.create({
         data: {
           billId: bill6.id,
           amount: 3500.00,
           method: 'online_payment',
           receiptImage: 'https://res.cloudinary.com/dvo4hzzpk/image/upload/v1757787538/receipts/receipt_1757787535902.jpg',
           status: 'failed',
           transactionId: null
         }
       })

       console.log('✅ Cancelled booking with failed payment created successfully')
     }

     // Seed Ads
     console.log('📢 Seeding ads...')

     // Create ads linked to specific trips
     await Promise.all([
       prisma.ad.create({
         data: {
           imageUrl: 'https://example.com/ads/damascus-aleppo-promo.jpg',
           url: '/trips/damascus-aleppo',
           description: 'Special promotion for Damascus to Aleppo trips! Book now and get 10% discount.',
           tripId: trips[0].id // Damascus to Aleppo
         }
       }),
       prisma.ad.create({
         data: {
           imageUrl: 'https://example.com/ads/damascus-beirut-special.jpg',
           url: '/trips/damascus-beirut',
           description: 'International travel made easy! Damascus to Beirut with premium service.',
           tripId: trips[2].id // Damascus to Beirut
         }
       }),
       prisma.ad.create({
         data: {
           imageUrl: 'https://example.com/ads/damascus-homs-express.jpg',
           url: '/trips/damascus-homs',
           description: 'Express service from Damascus to Homs. Fast and comfortable journey.',
           tripId: trips[1].id // Damascus to Homs
         }
       })
     ])

     // Create general ads (not linked to any specific trip)
     await Promise.all([
       prisma.ad.create({
         data: {
           imageUrl: 'https://example.com/ads/company-logo.jpg',
           url: '/about',
           description: 'Welcome to KSDora - Your trusted travel partner in Syria and the region.',
           tripId: null // General company ad
         }
       }),
       prisma.ad.create({
         data: {
           imageUrl: 'https://example.com/ads/summer-promotion.jpg',
           url: '/promotions',
           description: 'Summer travel promotion! Book any trip and get free refreshments on board.',
           tripId: null // General promotion ad
         }
       }),
       prisma.ad.create({
         data: {
           imageUrl: 'https://example.com/ads/safety-first.jpg',
           url: '/safety',
           description: 'Your safety is our priority. All our buses are regularly maintained and sanitized.',
           tripId: null // Safety information ad
         }
       }),
       prisma.ad.create({
         data: {
           imageUrl: 'https://example.com/ads/mobile-app.jpg',
           url: '/download-app',
           description: 'Download our mobile app for easy booking and real-time trip updates.',
           tripId: null // App promotion ad
         }
       })
     ])

     console.log('✅ Ads created successfully')

   } else {
     console.log('ℹ️ Sample user already exists')
   }

   console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })