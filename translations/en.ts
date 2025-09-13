import ConfirmDialog from "@/components/ConfirmDialog";

export const en = {
  nav: {
    home: 'Home',
    trips : 'Trips',
    myBookings : 'My Bookings',    
    bookSeat : 'Book Seat',
    dashboard : 'Dashboard',
  },
  home: {
    hero: {
      title: "Am'r For Tourism and Travel",
      subtitle: "Experience seamless journeys across cities with modern comfort and reliability",
      imageAlt: "Modern bus travel",
      exploreButton: "Explore Routes",
      bookButton: "Book Now"
    },
    stats: {
      cities: "Cities Connected",
      customers: "Happy Customers",
      support: "Customer Support"
    },
    cta: {
      title: "Ready to Start Your Journey?",
      description: "Join thousands of satisfied travelers who choose us for their journeys.",
      button: "View Available Routes"
    }
  },
  brand: 'kzdora',
  bookings: {
    title: 'My Bookings',
    status: {
      confirmed: 'Confirmed',
      completed: 'Completed',
      cancelled: 'Cancelled',
      pending: 'Pending',
    },

    noBookings: {
      title: 'No Bookings Found',
      description: "You haven't made any bookings yet.",
      cta: 'Book a Trip'
    },
    bookingCard: {
      bookingId: 'Booking ID',
      date: 'Date',
      seats: 'Seats',
      price: 'Price',
      viewDetails: 'View Details',
      cancelBooking: 'Cancel Booking'
    },
    modal: {
      title: 'Booking Details',
      from: 'From',
      to: 'To',
      travelDate: 'Travel Date',
      selectedSeats: 'Selected Seats',
      close: 'Close'
    },
    confirmCancel: {
      title: 'Cancel Booking',
      message: 'Are you sure you want to cancel booking ? This action cannot be undone.',
      confirm: 'Confirm',
      cancel: 'Cancel'
    },
    ConfirmDialog:{
      title: 'Complete Your Booking',
      tripDetails: {
        title: 'Trip Details',
        from: 'From',
        to: 'To',
        departure: 'Departure',
        arrival: 'Arrival',
        selectedSeats: 'Selected Seats',
        totalPrice: 'Total Price'
      },
      errors: {
        loadFailed: 'Failed to load trip details',
        loginRequired: 'Please login to continue',
        bookingFailed: 'Booking failed',
        default: 'Failed to create booking'
      },
      success: {
        title: 'Booking Successful!',
        redirect: 'Redirecting to your bookings...'
      },
      buttons: {
        confirm: 'Confirm Booking',
        processing: 'Processing...'
      },
    }
  },
  
  trips: {
    title: 'Available Trips',
    
    filters: {
      title: 'Filters',
      titlePage: 'Avilable Trips',
      NoTrips: 'No trips found for your search criteria.',
      sortBy: 'Sort By',
      priceRange: 'Price Range',
      min: 'Min',
      max: 'Max',
      departureTime: 'Departure Time',
      allTimes: 'All Times',
      morning: 'Morning (6AM - 12PM)',
      afternoon: 'Afternoon (12PM - 6PM)',
      evening: 'Evening (After 6PM)',
      sortOptions: {
        priceAsc: 'Price: Low to High',
        priceDesc: 'Price: High to Low',
        timeAsc: 'Departure: Earliest',
        timeDesc: 'Departure: Latest'
      }
    },
    tripCard: {
      seats: 'Available Seats',
      price: 'Price per seat',
      duration: 'Duration',
      bookNow: 'Book Now',
      soldOut: 'Sold Out',
      hours: 'hours',
      date : 'date',
    },
    noResults: {
      title: 'No Trips Found',
      description: 'Try adjusting your search criteria'
    },
    search: {
      placeholder: 'search on interfaces...',
      from: 'from',
      to: 'to',
      date: 'date',
      search: 'search on trips'
    },
    seats: {
      title: 'Select Your Seats',
      legend: {
        available: 'Available',
        selected: 'Selected',
        booked: 'Booked',
        blocked: 'Blocked'
      },
      selectedSeats: 'Selected Seats',
      totalPrice: 'Total Price',
      button: {
        continue: 'Continue',
        progress : 'progress...',
      },
      errors: {
        loadFailed: 'Failed to load seats'
      }
    }
  },

  bookSeat: {
    hero: {
      title: "Travel with Comfort",
      subtitle: "Book your bus tickets easily and start your journey today",
      imageAlt: "Bus Travel",
      exploreButton: "explore tracs",
      bookButton: "book now"
    },
    features: {
      easyBooking: {
        title: "Easy Booking",
        description: "Book your tickets in minutes with our simple booking system"
      },
      comfortableTravel: {
        title: "Comfortable Travel",
        description: "Travel in comfort with our modern fleet of buses"
      },
      bestPrices: {
        title: "Best Prices",
        description: "Get the best prices for your journey with no hidden fees"
      }
    },
    popularRoutes: {
      title: "Popular Routes"
    }
  },
  footer: {
    description: "Your trusted partner for comfortable and reliable bus travel across the country.",
    quickLinks: "Quick Links",
    support: "Support",
    help: "Help Center",
    contact: "Contact Us",
    followUs: "Follow Us",
    rights: "All rights reserved."
  }, 
  

  auth: {
    login: {
      title: 'Welcome back',
      subtitle: 'Sign in to your account to continue',
      email: {
        label: 'Email address',
        placeholder: 'Enter your email'
      },
      password: {
        label: 'Password',
        placeholder: 'Enter your password'
      },
      button: {
        signin: 'Sign in',
        loading: 'Signing in...',
        success: 'Success!'
      },

      noAccount: "Don't have an account? ",
      register : 'Register Now',
      forgotPassword: 'Forgot password?',
      successMessage: 'Login successful!...',
      backHome: 'Back to home page'
    },
    forgotPassword: {
      title: 'Forgot Password',
      subtitle: 'Enter your email address and we\'ll send you a link to reset your password',
      email: {
        label: 'Email address',
        placeholder: 'example@example.com'
      },
      button: {
        send: 'Send Reset Link',
        sending: 'Sending...',
        sent: 'Email Sent!'
      },
      success: 'Reset link sent! Please check your email.',
      backToLogin: 'Back to Login'
    },
    resetPassword: {
      title: 'Reset Password',
      subtitle: 'Enter the verification code sent to your email',
      code: {
        label: 'Verification Code',
        placeholder: 'Enter code from email'
      },
      newPassword: {
        label: 'New Password',
        placeholder: 'Enter new password'
      },
      confirmPassword: {
        label: 'Confirm New Password',
        placeholder: 'Confirm new password'
      },
      button: {
        reset: 'Reset Password',
        resetting: 'Resetting...',
        success: 'Success!'
      },
      errors: {
        passwordMismatch: 'Passwords do not match',
        resetFailed: 'Password reset failed'
      },
      success: 'Password reset successful! Redirecting to login...'
    },
    verify: {
      title: 'Email Verification',
      status: {
        pending: 'Verifying your email...',
        success: 'Email verified successfully! Redirecting to login...',
        error: 'Verification failed'
      },
      errors: {
        emailRequired: 'Email is required for verification'
      }
    },
    verifyCode: {
      title: 'Verify your code',
      subtitle: 'We have sent a code to your email',
      placeholder: 'Enter verification code',
      buttons: {
        verify: 'Verify',
        verifying: 'Verifying...',
        verified: 'Verified!',
        resend: "Didn't receive code? Resend",
        resending: "Resending..."
      },
      errors: {
        verificationFailed: 'Verification failed',
        generic: 'An error occurred',
        resendFailed: "Failed to resend verification code"
      },
      // 'Code verified successfully!'
      success: {
        done : 'Code verified successfully!',
        resend: "New verification code sent successfully"
      },
    },
    register: {

      title: 'Create your account',
      fullName: {
        label: 'Full Name',
        placeholder: 'Enter your full name'
      },
      email: {
        label: 'Email address',
        placeholder: 'Enter your email'
      },
      password: {
        label: 'Password',
        placeholder: 'Enter password'
      },
      confirmPassword: {
        label: 'Confirm Password',
        placeholder: 'Confirm your password'
      },
      phone: {
        label: 'Phone',
        placeholder: 'Phone (optional)'
      },
      button: {
        signup: 'Sign up',
        creating: 'Creating account...'
      },
      haveAccount: 'Already have an account? Sign in',
      errors: {
        passwordMismatch: 'Passwords do not match',
        passwordLength: 'Password must be at least 6 characters long'
      }
    }
  },
  dashboard: 
  {
        sidebar: {
          title: 'Admin Panel',
          dashboard: 'Dashboard',
          users: 'Users',
          bookings: 'Bookings',
          trips: 'Trips',
          buses: 'Buses',
          routes: 'Routes',
          cities: 'Cities',
          countries: 'Countries',
          reports: 'Reports',
          settings: 'Settings'
        },
        home: {
          title: 'Dashboard Overview',
          summary: {
            
            totalBookings: 'Total Bookings',
            activeTrips: 'Active Trips',
            totalRevenue: 'Total Revenue',
            totalCustomers: 'Total Customers'
          },
          recentBookings: {
            title: 'Recent Bookings',
            columns: {
              bookingId: 'Booking ID',
              customer: 'Customer',
              route: 'Route',
              date: 'Date',
              status: 'Status',
              amount: 'Amount'
            },
            noBookings: 'No recent bookings'
          },
          stats: {
            title: 'Statistics',
            daily: 'Daily',
            weekly: 'Weekly',
            monthly: 'Monthly'
          }
        }, 
        users: {
          title: 'Users Management',
          search: {
            placeholder: 'Search users...'
          },
          columns: {
            user: 'User',
            email: 'Email',
            role: 'Role',
            status: 'Status',
            joined: 'Joined',
            actions: 'Actions',
            noPhone: 'No phone'
          },
          status: {
            verified: 'Verified',
            pending: 'Pending'
          },
          delete: {
            title: 'Delete User',
            message: 'Are you sure you want to delete this user? This action cannot be undone.',
            confirm: 'Delete',
            cancel: 'Cancel',
            success: 'User deleted successfully',
            error: 'Failed to delete user'
          }
        },
        trips: {
          title: 'Trips Management',
          search: {
              placeholder: 'search on interfaces...',
              from: 'from',
              to: 'to',
              date: 'date',
              search: 'search on trips',
              results: 'Search Results',
              book: 'Book Now',
              noResults: 'No trips found for your search criteria'
          },
          addButton: 'Add Trip',
          processing: 'Processing...',
          columns: {
            titleAr: 'Title (Arabic)',
            titleEn: 'Title (English)',
            descriptionAr	: 'Description (Arabic)',
            descriptionEn	: 'Description (English',
            longitude	: 'location ',
            latitude	: 'location ',
            imageurl: 'imageUrl',
            route: 'Route',
            bus: 'Bus',
            schedule: 'Schedule',
            lastbookingTimes: 'Last Booking Time',
            price: 'Price',
            status: 'Status',
            actions: 'Actions',
            capacity: 'Capacity'
          },
          status: {
            scheduled: 'Scheduled',
            'in_progress': 'In Progress',
            completed: 'Completed',
            cancelled: 'Cancelled'
          },
          delete: {
            confirm: 'Are you sure you want to delete this trip?',
            success: 'Trip deleted successfully',
            error: 'Failed to delete trip'
          },
          form: {
            title: {
              new: 'Create New Trip',
              edit: 'Edit Trip'
            },
            labels: {
              // imageUrl:'image',
              images: "Uploaded Images",
              titleAr: 'Title (Arabic)',
              titleEn: 'Title (English)',
              descriptionAr	: 'Description (Arabic)',
              descriptionEn	: 'Description (English',
              latitude	: 'location (latitude)',
              longitude	: 'location (longitude)',
              route: 'Route',
              bus: 'Bus',
              departureTime: 'Departure Time',
              arrivalTime: 'Arrival Time',
              lastbookingTime: 'Last Booking Time',
              price: 'Price',
              status: 'Status'
            },
            placeholders: {
              selectRoute: 'Select a route',
              selectBus: 'Select a bus',
              busCapacity: 'Capacity'
            },
            buttons: {
              create: 'Create Trip',
              creating: 'Creating...',
              update: 'Update Trip',
              updating: 'Updating...',
              cancel: 'Cancel'
            },
            errors: {
              createFailed: 'Failed to create trip',
              updateFailed: 'Failed to update trip',
              loadFailed: 'Failed to load trip details'
            },
            success: {
              created: 'Trip created successfully',
              updated: 'Trip updated successfully'
            },
            status: {
              title:'edit form',
              options:{
                scheduled:  'scheduled',
                in_progress: 'in progress',
                completed: 'completed',
                cancelled: 'cancelled',
              }
            },

          }
        },
        routes: {
          title: 'Route Management',
          edit:{
            success : 'success',
            error : 'error'
          },
          search: {
            placeholder: 'Search routes...'
          },
          addButton: 'Add Route',
          columns: {
            from: 'From',
            to: 'To',
            distance: 'Distance (km)',
            activeTrips: 'Active Trips',
            createdAt: 'Created At',
            updatedAt: 'Updated At',
            actions: 'Actions'
          },
          delete: {
            title: 'Delete Route',
            message: 'Are you sure you want to delete this route? This action cannot be undone.',
            confirm: 'Delete',
            cancel: 'Cancel',
            success: 'Route deleted successfully',
            error: 'Failed to delete route'
          },
          form: {
            title: {
              new: 'Add New Route',
              edit: 'Edit Route'
            },
            labels: {
              departureCity: 'Departure City',
              arrivalCity: 'Arrival City',
              distance: 'Distance (km)'
            },
            placeholders: {
              selectDeparture: 'Select departure city',
              selectArrival: 'Select arrival city',
              distance: '350.50'
            },
            buttons: {
              create: 'Create Route',
              creating: 'Creating...',
              update: 'Update Route',
              updating: 'Updating...',
              cancel: 'Cancel'
            },
            errors: {
              createFailed: 'Failed to create route',
              updateFailed: 'Failed to update route',
              loadFailed: 'Failed to load cities'
            },
            success: {
              created: 'Route created successfully',
              updated: 'Route updated successfully'
            }
          }
        },
        cities: {
          title: 'City Management',
          search: {
            placeholder: 'Search cities...'
          },
          addButton: 'Add City',
          columns: {
            nameEn: 'Name (English)',
            nameAr: 'Name (Arabic)',
            routes: 'Routes',
            actions: 'Actions',
            countryId: 'country id '
          },
          delete: {
            title: 'Delete City',
            message: 'Are you sure you want to delete this city? This action cannot be undone.',
            confirm: 'Delete',
            cancel: 'Cancel',
            success: 'City deleted successfully',
            error: 'Failed to delete city'
          },
          form: {
            title: {
              new: 'Add New City',
              edit: 'Edit City'
            },
            labels: {
              nameEn: 'Name (English)',
              nameAr: 'Name (Arabic)',
              countryId: 'country Id'
            },
            placeholders: {
              nameEn: 'Jeddah',
              nameAr: 'جدة',
              countryId: 'بلد',
            },
            buttons: {
              create: 'Create City',
              creating: 'Creating...',
              update: 'Update City',
              updating: 'Updating...',
              cancel: 'Cancel'
            },
            errors: {
              createFailed: 'Failed to create city',
              updateFailed: 'Failed to update city',
              loadFailed: 'Failed to load cities'
            },
            success: {
              created: 'City created successfully',
              updated: 'City updated successfully'
            }
          }
        },
        countries: {
          title: 'countries Management',
          search: {
            placeholder: 'Search countries...'
          },
          addButton: 'Add Countery',
          columns: {
            nameEn: 'Name (English)',
            nameAr: 'Name (Arabic)',
            actions: 'Actions',
            code: 'Code'
          },
          delete: {
            title: 'Delete Country',
            message: 'Are you sure you want to delete this Country? This action cannot be undone.',
            confirm: 'Delete',
            cancel: 'Cancel',
            success: 'City deleted successfully',
            error: 'Failed to delete Country'
          },
          form: {
            title: {
              new: 'Add New Country',
              edit: 'Edit Country'
            },
            labels: {
              nameEn: 'Name (English)',
              nameAr: 'Name (Arabic)',
              code: 'code'
            },
            placeholders: {
              nameEn: 'Jeddah',
              nameAr: 'جدة',
              code: 'بلد',
            },
            buttons: {
              create: 'Create Country',
              creating: 'Creating...',
              update: 'Update Country',
              updating: 'Updating...',
              cancel: 'Cancel'
            },
            errors: {
              createFailed: 'Failed to create city',
              updateFailed: 'Failed to update city',
              loadFailed: 'Failed to load cities'
            },
            success: {
              created: 'Country created successfully',
              updated: 'Country updated successfully'
            }
          }
        },
        buses: {
          title: 'Bus Management',
          search: {
            placeholder: 'Search buses...'
          },
          addButton: 'Add Bus',
          columns: {
            plateNumber: 'Plate Number',
            model: 'Model',
            capacity: 'Capacity',
            status: 'Status',
            actions: 'Actions'
          },
          status: {
            active: 'Active',
            maintenance: 'Maintenance',
            inactive: 'inactive',
            passenger_filling: 'Passenger Filling',
            in_trip: 'In Trip'
          },
          delete: {
            title: 'Delete Bus',
            message: 'Are you sure you want to delete this bus? This action cannot be undone.',
            confirm: 'Delete',
            cancel: 'Cancel',
            success: 'Bus deleted successfully',
            error: 'Failed to delete bus'
          },
          form: {
            title: {
              new: 'Add New Bus',
              edit: 'Edit Bus'
            },
            labels: {
              plateNumber: 'Plate Number',
              model: 'Model',
              capacity: 'Capacity',
              status: 'Status'
            },
            placeholders: {
              plateNumber: 'ABC 123',
              model: 'Mercedes-Benz',
              capacity: '50'
            },
            buttons: {
              create: 'Create Bus',
              creating: 'Creating...',
              update: 'Update Bus',
              updating: 'Updating...',
              cancel: 'Cancel'
            },
            errors: {
              createFailed: 'Failed to create bus',
              updateFailed: 'Failed to update bus',
              loadFailed : 'Load Failed'
            },
            success: {
              created: 'Bus created successfully',
              updated: 'Bus updated successfully'
            },
            status: {
              active:  'Active',
              maintenance: 'Maintenance',
              inactive: 'inactive',
              
            },
          }
        },
        bookings: {
          title: 'Bookings Management',
          
          search: {
            placeholder: 'Search bookings...',
            noResults : 'no results',
          },
          columns: {
            
            bookingId: 'Booking ID',
            customer: 'Customer',
            route: 'Route',
            seats: 'Seats',
            status: 'Status',
            amount: 'Amount',
            actions: 'Actions',
            createdAt :  'created at',
            updatedAt : 'updated at'
          },
          status: {
            confirmed: 'Confirmed',
            completed: 'Completed',
            cancelled: 'Cancelled',
            pending: 'Pending'
          },
          statusAction : {
            cancelled : "It's Cancelled",
            alreadConfiremd : 'Already Confirmed',
            confirm : 'Confirm Booking ',
          },
          delete: {
            title: 'Delete Booking',
            message: 'Are you sure you want to delete this booking? This action cannot be undone.',
            confirm: 'Delete',
            cancel: 'Cancel',
            success: 'Booking deleted successfully',
            error: 'Failed to delete booking'
          },
          confirm: {
            title: 'Confirm your reservation',
            message: 'Are you sure you want to confirm this reservation?',
            confirm: 'confirm',
            cancel: 'Cancel',
            success: 'The reservation was successfully confirmed',
            error: 'Failed to confirm the reservation'
            },
          errors: {
            loadFailed: 'Failed to load bookings'
          },
          blockSeats: {
            title: 'Block Seats',
            selectTrip: 'Select Trip',
            tripPlaceholder: 'Select a trip...',
            seatStatus: {
              available: 'Available',
              selected: 'Selected',
              blocked: 'Blocked',
              booked: 'Booked'
            },
            buttons: {
              blockSelected: 'Block Selected Seats'
            },
            errors: {
              fetchTrips: 'Internal server error trips',
              fetchSeats: 'Internal server error seats',
              blockSeats: 'Failed to block seats',
              noSeatsSelected: 'Please select seats to block',
              noSeatsFound: 'No seats found for this trip'
            },
            success: {
              seatsBlocked: 'Seats blocked successfully'
            }
          },
          toastMsg:{  
            success: 'Booking confirmed successfully',
          },
        },
        bookingDetails: {
          title: 'Customer Information',
          labels: {
            name: 'Name',
            email: 'Email',
            phone: 'Phone'
          },
          buttons: {
            close: 'Close'
          }
        },
        editRoute: {
          title: 'Edit Route',
          labels: {
            departureCity: 'Departure City',
            arrivalCity: 'Arrival City',
            distance: 'Distance (km)'
          },
          placeholders: {
            selectDeparture: 'Select departure city',
            selectArrival: 'Select arrival city'
          },
          buttons: {
            cancel: 'Cancel',
            update: 'Update Route',
            updating: 'Updating...'
          },
          errors: {
            fetchCities: 'Internal server error cities',
            updateRoute: 'Failed to update route'
          },
          success: {
            updated: 'Route updated successfully'
          }
        }
  },
  search: {
    from: 'From',
    to: 'To',
    submit: 'Search Trips',
    searching: 'Searching...',
    results: 'Search Results',
    book: 'Book Now',
    noResults: 'No trips found for your search criteria',
    date: 'Date',
    placeholder: 'Search...'
  },
  errors: {
    notFound: {
      title: 'Page Not Found',
      message: 'The page you are looking for might have been removed or is temporarily unavailable.',
      backToHome: 'Back to Dashboard'
    }
  }
}
