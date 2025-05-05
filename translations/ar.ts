// import bookSeat from "@/app/book-seat/page";

import ConfirmDialog from "@/components/ConfirmDialog";

export const ar = {
  nav: {
    
    home: 'الرئيسية',
    trips : 'الرحلات',
    myBookings: 'الحجوزات',
    bookSeat : 'احجز مقعدك',
    dashboard : 'لوحة التحكم',
    
  },
  home: {
    hero: {
      title: "عمرو للسياحة و السفر",
      subtitle: "استمتع بتجربة نقل مريحة وموثوقة بين المدن",
      imageAlt: "السفر بالحافلات الحديثة",
      exploreButton: "استكشف المسارات",
      bookButton: "احجز الآن"
    },
    stats: {
      cities: "المدن المتوفرة",
      customers: "زبائن سعيدة",
      support: "قسم دعم فني"
    },
    cta: {
      title: "هل أنت مستعد لبدء رحلتك؟",
      description: "انضم إلى آلاف المسافرين الراضين الذين اختارونا لرحلاتهم.",
      button: "عرض المسارات المتاحة"
    },
    features: {
      easyBooking: {
        title: "حجز سهل",
        description: "احجز تذاكرك في دقائق مع نظام الحجز البسيط لدينا"
      },
      comfortableTravel: {
        title: "سفر مريح",
        description: "حافلات حديثة مع مقاعد مريحة ووسائل راحة"
      },
      bestPrices: {
        title: "أفضل الأسعار",
        description: "أسعار تنافسية وخصومات منتظمة لعملائنا"
      }
    },
    popularRoutes: {
      title: "المسارات الشائعة"
    }
  },
  
  brand: 'احزم حقائبك',
  bookings: {
    title: 'الحجوزات الخاصة بي',
    noResults : 'لا يوجد نتيجة',
    confirm : 'تاكيد',
    status: {
      confirmed: 'تأكيد',
      completed: 'مكتمل',
      cancelled: 'ملغي',
      pending: 'قيد الانتظار'
    },

    noBookings: {
      title: 'لا توجد حجوزات',
      description: 'لم تقم بأي حجوزات حتى الآن',
      cta: 'احجز رحلة'
    },
    bookingCard: {
      bookingId: 'رقم الحجز',
      date: 'التاريخ',
      seats: 'المقاعد',
      price: 'السعر',
      viewDetails: 'عرض التفاصيل',
      cancelBooking: 'إلغاء الحجز'
    },
    modal: {
      title: 'تفاصيل الحجز',
      from: 'من',
      to: 'إلى',
      travelDate: 'تاريخ السفر',
      selectedSeats: 'المقاعد المحجوزة',
      close: 'إغلاق'
    },
    confirmCancel: {
      title: 'إلغاء الحجز',
      message: 'هل أنت متأكد من إلغاء الحجز ؟ لا يمكن التراجع عن هذا الإجراء',
      confirm: 'تأكيد',
      cancel: 'إلغاء'
    },

    ConfirmDialog :{
      title: 'إتمام الحجز',
      tripDetails: {
        title: 'تفاصيل الرحلة',
        from: 'من',
        to: 'إلى',
        departure: 'وقت المغادرة',
        arrival: 'وقت الوصول',
        selectedSeats: 'المقاعد المختارة',
        totalPrice: 'السعر الإجمالي'
      },
      errors: {
        loadFailed: 'فشل تحميل تفاصيل الرحلة',
        loginRequired: 'الرجاء تسجيل الدخول للمتابعة',
        bookingFailed: 'فشل الحجز',
        default: 'فشل إنشاء الحجز'
      },
      success: {
        title: 'تم الحجز بنجاح!',
        redirect: 'جاري التحويل إلى حجوزاتك...'
      },
      buttons: {
        confirm: 'تأكيد الحجز',
        processing: 'جاري المعالجة...'
      }
    }

  },

   trips: {
      title: 'الرحلات المتاحة',
      
      search: {
        placeholder: 'البحث عن الوجهات...',
        from: 'من',
        to: 'إلى',
        date: 'التاريخ',
        search: 'بحث عن رحلات'
      },
      filters: {
        title: 'التصفية',
        titlePage: 'الرحلات المتوفرة',
        NoTrips: 'لم يتم العثور على رحلات تتوافق مع معايير البحث الخاصة بك.',
        sortBy: 'ترتيب حسب',
        priceRange: 'نطاق السعر',
        min: 'الحد الأدنى',
        max: 'الحد الأقصى',
        departureTime: 'وقت المغادرة',
        allTimes: 'جميع الأوقات',
        morning: 'صباحاً (6 ص - 12 م)',
        afternoon: 'ظهراً (12 م - 6 م)',
        evening: 'مساءً (بعد 6 م)',
        sortOptions: {
          priceAsc: 'السعر: من الأقل إلى الأعلى',
          priceDesc: 'السعر: من الأعلى إلى الأقل',
          timeAsc: 'المغادرة: الأقرب',
          timeDesc: 'المغادرة: الأبعد'
        }
      },
      tripCard: {
        seats: 'المقاعد المتاحة',
        price: 'سعر المقعد',
        duration: 'المدة',
        bookNow: 'احجز الآن',
        soldOut: 'نفذت التذاكر',
        hours: 'ساعات',
        date : 'تاريخ',
      },
      noResults: {
        title: 'لا توجد رحلات',
        description: 'حاول تعديل معايير البحث'
      },
      seats: {
        title: 'اختر مقاعدك',
        legend: {
          available: 'متاح',
          selected: 'تم اختياره',
          booked: 'محجوز',
          blocked: 'مقفل'
        },
        selectedSeats: 'المقاعد المحجوزة',
        totalPrice: 'السعر الإجمالي',
        button: {
          continue: 'متابعة',
          progress : '...قيد المعالجة',
        },
        errors: {
          loadFailed: 'فشل تحميل المقاعد'
        }
      }
    },
    bookSeat: {
      hero: {
        title: "سافر براحة",
        subtitle: "احجز تذاكر الحافلة بسهولة وابدأ رحلتك اليوم",
        imageAlt: "السفر بالحافلة",
        exploreButton: "اكتشف المسارات",
        bookButton: "احجز الان"
      },
      features: {
        easyBooking: {
          title: "حجز سهل",
          description: "احجز تذاكرك في دقائق مع نظام الحجز البسيط لدينا"
        },
        comfortableTravel: {
          title: "سفر مريح",
          description: "سافر براحة مع أسطولنا الحديث من الحافلات"
        },
        bestPrices: {
          title: "أفضل الأسعار",
          description: "احصل على أفضل الأسعار لرحلتك بدون رسوم خفية"
        }
      },
      popularRoutes: {
        title: "الوجهات الشائعة"
      }
    },
    footer: {
      description: "شريكك الموثوق للسفر المريح والموثوق به بالحافلات عبر المملكة.",
      quickLinks: "روابط سريعة",
      support: "الدعم",
      help: "مركز المساعدة",
      contact: "اتصل بنا",
      followUs: "تابعنا",
      rights: "جميع الحقوق محفوظة."
    },
    auth: {
      login: {
        title: 'مرحباً بعودتك',
        subtitle: 'سجل دخول إلى حسابك للمتابعة',
        email: {
          label: 'البريد الإلكتروني',
          placeholder: 'أدخل بريدك الإلكتروني'
        },
        password: {
          label: 'كلمة المرور',
          placeholder: 'أدخل كلمة المرور'
        },
        button: {
          signin: 'تسجيل الدخول',
          loading: 'جاري تسجيل الدخول...',
          success: 'تم بنجاح!'
        },
        noAccount: 'ليس لديك حساب؟ ',
        register : 'سجل الآن',
        forgotPassword: 'نسيت كلمة المرور؟',
        successMessage: 'تم تسجيل الدخول بنجاح! ...',
        backHome: 'العودة الى الصفحة الرئيسية'
      },
      forgotPassword: {
        title: 'نسيت كلمة المرور',
        subtitle: 'أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور',
        email: {
          label: 'البريد الإلكتروني',
          placeholder: 'example@example.com'
        },
        button: {
          send: 'إرسال رابط إعادة التعيين',
          sending: 'جاري الإرسال...',
          sent: 'تم الإرسال!'
        },
        success: 'تم إرسال رابط إعادة التعيين! يرجى التحقق من بريدك الإلكتروني.',
        backToLogin: 'العودة لتسجيل الدخول'
      },
      resetPassword: {
        title: 'إعادة تعيين كلمة المرور',
        subtitle: 'أدخل رمز التحقق المرسل إلى بريدك الإلكتروني',
        code: {
          label: 'رمز التحقق',
          placeholder: 'أدخل الرمز من البريد الإلكتروني'
        },
        newPassword: {
          label: 'كلمة المرور الجديدة',
          placeholder: 'أدخل كلمة المرور الجديدة'
        },
        confirmPassword: {
          label: 'تأكيد كلمة المرور الجديدة',
          placeholder: 'تأكيد كلمة المرور الجديدة'
        },
        button: {
          reset: 'إعادة تعيين كلمة المرور',
          resetting: 'جاري إعادة التعيين...',
          success: 'تم بنجاح!'
        },
        errors: {
          passwordMismatch: 'كلمات المرور غير متطابقة',
          resetFailed: 'فشلت إعادة تعيين كلمة المرور'
        },
        success: 'تم إعادة تعيين كلمة المرور بنجاح! جاري التحويل إلى صفحة تسجيل الدخول...'
      },
      verify: {
        title: 'تأكيد البريد الإلكتروني',
        status: {
          pending: 'جاري التحقق من بريدك الإلكتروني...',
          success: 'تم تأكيد البريد الإلكتروني بنجاح! جاري التحويل لصفحة تسجيل الدخول...',
          error: 'فشل التحقق'
        },
        errors: {
          emailRequired: 'البريد الإلكتروني مطلوب للتحقق'
        }
      },
      verifyCode: {
        title: 'تحقق من الرمز',
        subtitle: 'لقد أرسلنا رمزاً إلى بريدك الإلكتروني',
        placeholder: 'أدخل رمز التحقق',
        buttons: {
          verify: 'تحقق',
          verifying: 'جاري التحقق...',
          verified: 'تم التحقق!',
          resend: 'لم يصلك الرمز؟ إعادة الإرسال',
          resending: "جاري إعادة الإرسال..."
        },
        errors: {
          verificationFailed: 'فشل التحقق',
          generic: 'حدث خطأ',
          resendFailed: "فشل في إعادة إرسال رمز التحقق"
        },
        // 'تم التحقق من الرمز بنجاح!',
        success: {
          done : 'تم التحقق من الرمز بنجاح!',
          resend: "تم إرسال رمز تحقق جديد بنجاح"

        },
      },
      register: {

        title: 'إنشاء حساب جديد',
        fullName: {
          label: 'الاسم الكامل',
          placeholder: 'أدخل اسمك الكامل'
        },
        email: {
          label: 'البريد الإلكتروني',
          placeholder: 'أدخل بريدك الإلكتروني'
        },
        password: {
          label: 'كلمة المرور',
          placeholder: 'أدخل كلمة المرور'
        },
        confirmPassword: {
          label: 'تأكيد كلمة المرور',
          placeholder: 'تأكيد كلمة المرور'
        },
        phone: {
          label: 'رقم الهاتف',
          placeholder: 'رقم الهاتف (اختياري)'
        },
        button: {
          signup: 'إنشاء حساب',
          creating: 'جاري إنشاء الحساب...'
        },
        haveAccount: 'لديك حساب بالفعل؟ تسجيل الدخول',
        errors: {
          passwordMismatch: 'كلمات المرور غير متطابقة',
          passwordLength: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل'
        }
      }
    },
    dashboard:
    {
      sidebar: {
        title: 'لوحة التحكم',
        dashboard: 'الرئيسية',
        users: 'المستخدمين',
        bookings: 'الحجوزات',
        trips: 'الرحلات',
        buses: 'الحافلات',
        routes: 'المسارات',
        cities: 'المدن',
        reports: 'التقارير',
        settings: 'الإعدادات'
      },
      home: {
        title: 'واجهة لوحة التحكم',
        summary: {
          totalBookings: 'مجموع المقاعد',
          activeTrips: 'الرحلات المفعلة',
          totalRevenue: 'إجمالي الإيرادات',
          totalCustomers: 'مجموع العملاء'
        },
        recentBookings: {
          title: ' الحجوزات الأخيرة',
          columns: {
            bookingId: 'رقم الحجز',
            customer: 'عميل',
            route: 'طريق',
            date: 'تاريخ',
            status: 'الحالة',
            amount: 'المجموع'
          },
          noBookings: 'لا يوجد حجوزات ماخرة'
        },
        stats: {
          title: 'إحصائيات',
          daily: 'يومي',
          weekly: 'اسبوعي',
          monthly: 'شهري'
        }
      },
      users: {
        title: 'إدارة المستخدمين',
        search: {
          placeholder: 'البحث عن المستخدمين...'
        },
        columns: {
          user: 'المستخدم',
          email: 'البريد الإلكتروني',
          role: 'الدور',
          status: 'الحالة',
          joined: 'تاريخ التسجيل',
          actions: 'إجراءات',
          noPhone: 'لا يوجد هاتف'
        },
        status: {
          verified: 'تم التحقق',
          pending: 'قيد الانتظار'
        },
        delete: {
          title: 'حذف المستخدم',
          message: 'هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.',
          confirm: 'حذف',
          cancel: 'إلغاء',
          success: 'تم حذف المستخدم بنجاح',
          error: 'فشل حذف المستخدم'
        }
      },
      trips: {
        title: 'إدارة الرحلات',
        search: {
          placeholder: 'البحث عن الرحلات...',
          from: 'من',
          to: 'الى',
          date: 'تاريخ',
          search: 'البحث عن رحلة',
          results: 'بحث عن نتائج',
          book: 'احجز الآن',
          noResults: 'لم يتم العثور على رحلات تتوافق مع معايير البحث الخاصة بك'
        },
        addButton: 'إضافة رحلة',
        processing: 'جاري المعالجة...',
        columns: {
          route: 'المسار',
          bus: 'الحافلة',
          schedule: 'الجدول',
          price: 'السعر',
          status: 'الحالة',
          actions: 'إجراءات',
          capacity: 'السعة'
        },
        status: {
          scheduled: 'مجدولة',
          'in_progress': 'قيد التنفيذ',
          completed: 'مكتملة',
          cancelled: 'ملغاة'
        },
        delete: {
          confirm: 'هل أنت متأكد من حذف هذه الرحلة؟',
          success: 'تم حذف الرحلة بنجاح',
          error: 'فشل حذف الرحلة'
        },
        form: {
          title: {
            new: 'إنشاء رحلة جديدة',
            edit: 'تعديل الرحلة'
          },
          labels: {
            route: 'المسار',
            bus: 'الحافلة',
            departureTime: 'وقت المغادرة',
            arrivalTime: 'وقت الوصول',
            price: 'السعر',
            status: 'الحالة'
          },
          placeholders: {
            selectRoute: 'اختر المسار',
            selectBus: 'اختر الحافلة',
            busCapacity: 'السعة'
          },
          buttons: {
            create: 'إنشاء الرحلة',
            creating: 'جاري الإنشاء...',
            update: 'تحديث الرحلة',
            updating: 'جاري التحديث...',
            cancel: 'إلغاء'
          },
          errors: {
            createFailed: 'فشل إنشاء الرحلة',
            updateFailed: 'فشل تحديث الرحلة',
            loadFailed: 'فشل تحميل تفاصيل الرحلة'
          },
          success: {
            created: 'تم إنشاء الرحلة بنجاح',
            updated: 'تم تحديث الرحلة بنجاح'
          },
          status: {
            title:'تعديل الواجهة',
            options:{
              scheduled:  'مُجدول',
              in_progress: 'قيد التنفيذ',
              completed: 'مُكتمل',
              cancelled: 'ملغي',
            }
          },
        }
      },

      routes: {
        title: 'إدارة المسارات',
        edit:{
          success : 'تم التحديث بنجاح',
          error : 'خطأ'
        },
        search: {
          placeholder: 'البحث عن المسارات...'
        },
        addButton: 'إضافة مسار',
        columns: {
          from: 'من',
          to: 'إلى',
          distance: 'المسافة (كم)',
          activeTrips: 'الرحلات النشطة',
          actions: 'إجراءات'
        },
        delete: {
          title: 'حذف المسار',
          message: 'هل أنت متأكد من حذف هذا المسار؟ لا يمكن التراجع عن هذا الإجراء.',
          confirm: 'حذف',
          cancel: 'إلغاء',
          success: 'تم حذف المسار بنجاح',
          error: 'فشل حذف المسار'
        },
        form: {
          title: {
            new: 'إضافة مسار جديد',
            edit: 'تعديل المسار'
          },
          labels: {
            departureCity: 'مدينة المغادرة',
            arrivalCity: 'مدينة الوصول',
            distance: 'المسافة (كم)'
          },
          placeholders: {
            selectDeparture: 'اختر مدينة المغادرة',
            selectArrival: 'اختر مدينة الوصول',
            distance: '350.50'
          },
          buttons: {
            create: 'إنشاء المسار',
            creating: 'جاري الإنشاء...',
            update: 'تحديث المسار',
            updating: 'جاري التحديث...',
            cancel: 'إلغاء'
          },
          errors: {
            createFailed: 'فشل إنشاء المسار',
            updateFailed: 'فشل تحديث المسار',
            loadFailed: 'فشل تحميل المدن'
          },
          success: {
            created: 'تم إنشاء المسار بنجاح',
            updated: 'تم تحديث المسار بنجاح'
          }
        }
      },
      cities: {
        title: 'إدارة المدن',
        search: {
          placeholder: 'البحث عن المدن...'
        },
        addButton: 'إضافة مدينة',
        columns: {
          nameEn: 'الاسم (إنجليزي)',
          nameAr: 'الاسم (عربي)',
          routes: 'المسارات',
          actions: 'إجراءات'
        },
        delete: {
          title: 'حذف المدينة',
          message: 'هل أنت متأكد من حذف هذه المدينة؟ لا يمكن التراجع عن هذا الإجراء.',
          confirm: 'حذف',
          cancel: 'إلغاء',
          success: 'تم حذف المدينة بنجاح',
          error: 'فشل حذف المدينة'
        },
        form: {
          title: {
            new: 'إضافة مدينة جديدة',
            edit: 'تعديل المدينة'
          },
          labels: {
            nameEn: 'الاسم (إنجليزي)',
            nameAr: 'الاسم (عربي)'
          },
          placeholders: {
            nameEn: 'جدة',
            nameAr: 'جدة'
          },
          buttons: {
            create: 'إنشاء المدينة',
            creating: 'جاري الإنشاء...',
            update: 'تحديث المدينة',
            updating: 'جاري التحديث...',
            cancel: 'إلغاء'
          },
          errors: {
            createFailed: 'فشل إنشاء المدينة',
            updateFailed: 'فشل تحديث المدينة',
            loadFailed: 'فشل تحميل المدن'
          },
          success: {
            created: 'تم إنشاء المدينة بنجاح',
            updated: 'تم تحديث المدينة بنجاح'
          }
        }
      },
      buses: {
        title: 'إدارة الحافلات',
        search: {
          placeholder: 'البحث عن الحافلات...'
        },
        addButton: 'إضافة حافلة',
        columns: {
          plateNumber: 'رقم اللوحة',
          model: 'الموديل',
          capacity: 'السعة',
          status: 'الحالة',
          actions: 'إجراءات'
        },
        status: {
          active: 'نشط',
          maintenance: 'صيانة',
          inactive: 'متقاعد',
          passenger_filling: 'تعبئة الركاب',
          in_trip: 'في رحلة'
        },
        delete: {
          title: 'حذف الحافلة',
          message: 'هل أنت متأكد من حذف هذه الحافلة؟ لا يمكن التراجع عن هذا الإجراء.',
          confirm: 'حذف',
          cancel: 'إلغاء',
          success: 'تم حذف الحافلة بنجاح',
          error: 'فشل حذف الحافلة'
        },
        form: {
          title: {
            new: 'إضافة حافلة جديدة',
            edit: 'تعديل الحافلة'
          },
          labels: {
            plateNumber: 'رقم اللوحة',
            model: 'الموديل',
            capacity: 'السعة',
            status: 'الحالة'
          },
          placeholders: {
            plateNumber: 'ABC 123',
            model: 'مرسيدس-بنز',
            capacity: '٥٠'
          },
          buttons: {
            create: 'إنشاء الحافلة',
            creating: 'جاري الإنشاء...',
            update: 'تحديث الحافلة',
            updating: 'جاري التحديث...',
            cancel: 'إلغاء'
          },
          errors: {
            createFailed: 'فشل إنشاء الحافلة',
            updateFailed: 'فشل تحديث الحافلة',
            loadFailed : 'فشل التحميل'
          },
          success: {
            created: 'تم إنشاء الحافلة بنجاح',
            updated: 'تم تحديث الحافلة بنجاح'
          },
          status: {
            active:  'مفعل',
            maintenance: 'صيانة',
            inactive: 'في الأرشيف',
          }
        }
      },
      bookings: {
        title: 'إدارة الحجوزات',
       
        search: {
          placeholder: 'البحث في الحجوزات...',
          noResults : 'لا يوجد نتائج',
        },
        columns: {
          bookingId: 'رقم الحجز',
          customer: 'العميل',
          route: 'المسار',
          seats: 'المقاعد',
          status: 'الحالة',
          amount: 'المبلغ',
          actions: 'إجراءات'
        },
        status: {
          confirmed: 'مؤكد',
          completed: 'مكتمل',
          cancelled: 'ملغي',
          pending: 'قيد الانتظار'
        },
        statusAction : {
          cancelled : "ملغاة",
          alreadConfiremd : 'مؤكدة',
          confirm : 'تأكيد الحجز',
        },
        delete: {
          title: 'حذف الحجز',
          message: 'هل أنت متأكد من حذف هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.',
          confirm: 'حذف',
          cancel: 'إلغاء',
          success: 'تم حذف الحجز بنجاح',
          error: 'فشل حذف الحجز'
        },
        confirm: {
          title: 'تأكيد الحجز',
          message: 'هل أنت متأكد من تأكيد هذا الحجز؟.',
          confirm: 'تأكيد',
          cancel: 'إلغاء',
          success: 'تم التأكيد الحجز بنجاح',
          error: 'فشل تأكيد الحجز'
        },
        errors: {
          loadFailed: 'فشل تحميل الحجوزات'
        },
        toastMsg:{  
          success: 'تم تأكيد الحجز بنجاح',
        },
        blockSeats: {
          title: 'حظر مقاعد',
          selectTrip: 'اختر الرحلة',
          tripPlaceholder: 'اختر رحلة...',
          seatStatus: {
            available: 'متاح',
            selected: 'محدد',
            blocked: 'محظور',
            booked: 'محجوز'
          },
          buttons: {
            blockSelected: 'حظر مقاعد المحددة'
          },
          errors: {
            fetchTrips: 'فشل في جلب الرحلات',
            fetchSeats: 'فشل في جلب المقاعد',
            blockSeats: 'فشل في حظر مقاعد',
            noSeatsSelected: 'الرجاء تحديد المقاعد للحظر'
          },
          success: {
            seatsBlocked: 'تم حظر مقاعد بنجاح'
          }
        },
        
      },
      bookingDetails: {
        title: 'معلومات العميل',
        labels: {
          name: 'الاسم',
          email: 'البريد الإلكتروني',
          phone: 'رقم الهاتف'
        },
        buttons: {
          close: 'إغلاق'
        }
      },
      editRoute: {
        title: 'تعديل المسار',
        labels: {
          departureCity: 'مدينة المغادرة',
          arrivalCity: 'مدينة الوصول',
          distance: 'المسافة (كم)'
        },
        placeholders: {
          selectDeparture: 'اختر مدينة المغادرة',
          selectArrival: 'اختر مدينة الوصول'
        },
        buttons: {
          cancel: 'إلغاء',
          update: 'تحديث المسار',
          updating: 'جاري التحديث...'
        },
        errors: {
          fetchCities: 'فشل في جلب المدن',
          updateRoute: 'فشل في تحديث المسار'
        },
        success: {
          updated: 'تم تحديث المسار بنجاح'
        }
      }
     
    },
   
    search: {  
      from: 'من',
      to: 'إلى',
      date: 'التاريخ',
      submit: 'بحث',
      searching: 'جاري البحث...',
      placeholder: 'بحث...',
      results: 'نتائج البحث',
      book: 'احجز الآن',
      noResults: 'لم يتم العثور على رحلات تتوافق مع معايير البحث الخاصة بك',
    },
    errors: {
      notFound: {
        title: 'الصفحة غير موجودة',
        message: 'الصفحة التي تبحث عنها قد تكون حذفت أو غير متوفرة مؤقتاً',
        backToHome: 'العودة إلى لوحة التحكم'
      }
    },
}

