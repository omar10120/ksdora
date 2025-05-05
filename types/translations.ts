export interface Translations {
  nav: {
    home: string,
    trips: string,
    myBookings: string,
    bookSeat : string,
    dashboard : string,
  }
  
  trips: {
    title: string
    search: {
      placeholder: string
      from: string
      to: string
      date: string
      search: string


    }
    filters: {
      title: string
      sortBy: string
      priceRange: string
      min: string
      max: string
      departureTime: string
      allTimes: string
      morning: string
      afternoon: string
      evening: string
      sortOptions: {
        priceAsc: string
        priceDesc: string
        timeAsc: string
        timeDesc: string
      }
    }
    tripCard: {
      seats: string
      price: string
      duration: string
      bookNow: string
      soldOut: string
      hours: string
      
      
    }
    noResults: {
      title: string
      description: string
    }
  }
  bookings: {
    title: 'الحجوزات الخاصة بي',
    noResults : 'لا يوجد نتيجة',
    confirm :{
      error : 'خطأ',
      success : 'نجح'
  },
    status: {
      confirmed: 'تأكيد',
      completed: 'مكتمل',
      cancelled: 'ملغي',
      pending: 'قيد الانتظار'
    },

    noBookings: {
      title: string
      description: string
      cta:string
    },
    bookingCard: {
      bookingId:string
      date: string
      seats:string
      price: string
      viewDetails:string
      cancelBooking: string
    },
    modal: {
      title: string
      from: string
      to: string
      travelDate: string
      selectedSeats: string
      close: string
    }
    confirmCancel: {
      title: string
      message: string
      confirm: string
      cancel: string
    }

  },
  
  
  home: {
    hero: {
      title: string,
      subtitle: string,
      imageAlt: string,
      exploreButton: string,
      bookButton: string
    },
    stats: {
      cities: string,
      customers: string,
      support: string
    },
    cta: {
      title: string,
      description: string,
      button: string
    }
  },
  brand: string,
  bookSeat: {
    hero: {
      title: string,
      subtitle: string,
      imageAlt: string
    },
    features: {
      easyBooking: {
        title: string,
        description: string
      },
      comfortableTravel: {
        title: string,
        description: string
      },
      bestPrices: {
        title: string,
        description: string
      }
    },
    popularRoutes: {
      title: string
    }
  },
  footer: {
    description: string,
    quickLinks: string,
    support: string,
    help: string,
    contact: string,
    followUs: string,
    rights: string
  },
  auth: {
    login: {
      title: string,
      subtitle: string,
      email: {
        label: string,
        placeholder: string
      },
      password: {
        label: string,
        placeholder: string
      },
      button: {
        signin: string,
        loading:string,
        success:string,
      },
      noAccount: string,
      forgotPassword: string,
      successMessage: string,
    },
    forgotPassword: {
      title: string,
      subtitle: string,
      email: {
        label: string,
        placeholder: string,
      },
      button: {
        send: string,
        sending: string,
        sent: string,
      },
      success: string,
      backToLogin: string,
    },
    resetPassword: {
      title: string,
      subtitle:string,
      code: {
        label: string,
        placeholder: string,
      },
      newPassword: {
        label: string,
        placeholder: string,
      },
      confirmPassword: {
        label: string,
        placeholder:string,
      },
      button: {
        reset: string,
        resetting: string,
        success: string,
      },
      errors: {
        passwordMismatch:string,
        resetFailed: string,
      },
      success: string,
    },
    verify: {
      title: string,
      status: {
        pending: string,
        success: string,
        error: string,
      },
      errors: {
        emailRequired: string,
      }
    },
    verifyCode: {
      title: string,
      subtitle: string,
      placeholder: string,
      buttons: {
        verify: string,
        verifying: string,
        verified: string,
        resend: string,
        resending: string,
      },
      errors: {
        verificationFailed:string,
        generic: string,
        resendFailed: string,
      },
      // 'Code verified successfully!'
      success: {
        done : string,
        resend: string,
      },
    },
    register: {
      title: string,
      fullName: {
        label: string,
        placeholder: string,
      },
      email: {
        label: string,
        placeholder: string,
      },
      password: {
        label: string,
        placeholder: string,
      },
      confirmPassword: {
        label: string,
        placeholder: string,
      },
      phone: {
        label: string,
        placeholder: string,
      },
      button: {
        signup: string,
        creating: string,
      },
      haveAccount: string,
      errors: {
        passwordMismatch:string,
        passwordLength: string,
      }
    }
  },
  dashboard: {
    home: {
      title: string
      summary: {
        totalBookings: string
        activeTrips: string
        totalRevenue: string
        totalCustomers: string
      }
      recentBookings: {
        title: string
        noResults : string
        columns: {
          bookingId: string
          customer: string
          route: string
          date: string
          status: string
          amount: string
        }
        noBookings: string
      }
      stats: {
        title: string
        daily: string
        weekly: string
        monthly: string
      }
    }
  },
  search: {  // <-- Make sure this exists in Arabic translations too
    from: string,
    to: string,
    date: string,
    submit: string,
    searching: string,
    placeholder: string,
  },

  errors: {
    notFound: {
      title: string,
      message: string,
      backToHome: string
    }
  }
}


