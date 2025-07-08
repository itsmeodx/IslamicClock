/**
 * Translations for the Islamic Prayer Clock application
 * Contains translations for all UI elements in English and Arabic
 */
const Translations = {
    en: {
        title: '🕌 Islamic Prayer Clock',
        switchToDigital: 'Switch to Digital',
        switchToPrayerClock: 'Switch to Prayer Clock',
        languageButton: 'العربية',
        loading: 'Loading...',
        gettingLocation: '📍 Getting location...',
        hijriLoading: '🌙 Loading...',
        hijriError: '🌙 Failed to load Hijri date',
        nextPrayer: 'Next',
        remaining: 'remaining',
        complete: 'Complete',
        defaultLocation: 'Mecca, Saudi Arabia',
        // Weekdays for digital display
        weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        // Months for digital display
        months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        // Prayer names (for display)
        prayers: {
            Fajr: 'Fajr',
            Sunrise: 'Sunrise',
            Dhuhr: 'Dhuhr',
            Asr: 'Asr',
            Maghrib: 'Maghrib',
            Isha: 'Isha',
            Midnight: 'Midnight'
        },
        // Settings menu translations
        settings: 'Settings',
        language: 'Language',
        clockMode: 'Clock Mode',
        digital: 'Digital',
        analog: 'Analog',
        calculationMethod: 'Calculation Method',
        daylightSaving: 'Daylight Saving Time',
        dstMinus1Hour: '-1 Hour',
        dstOff: 'Off',
        dstPlus1Hour: '+1 Hour',
        progressSection: 'Show Progress Section',
        progressHide: 'Hide',
        progressShow: 'Show',
        prayerTimeAdjustments: 'Prayer Time Adjustments (minutes)',
        hijriOffset: 'Hijri Date Adjustment (days)',
        hijriMinus1Day: '-1 Day',
        hijriNoChange: 'No Change',
        hijriPlus1Day: '+1 Day',
        save: 'Save',
        reset: 'Reset',
        refresh: 'Refresh',
        // Calculation method names
        calculationMethods: {
            0: 'Shia Ithna-Ashari, Leva Institute, Qum',
            1: 'University of Islamic Sciences, Karachi',
            2: 'Islamic Society of North America (ISNA)',
            3: 'Muslim World League',
            4: 'Umm Al-Qura University, Makkah',
            5: 'Egyptian General Authority of Survey',
            7: 'Institute of Geophysics, University of Tehran',
            8: 'Gulf Region',
            9: 'Kuwait',
            10: 'Qatar',
            11: 'Majlis Ugama Islam Singapura, Singapore',
            12: 'Union Organization Islamic de France',
            13: 'Diyanet İşleri Başkanlığı, Turkey',
            14: 'Spiritual Administration of Muslims of Russia',
            15: 'Moonsighting Committee Worldwide (Moonsighting.com)',
            16: 'Dubai (experimental)',
            17: 'Jabatan Kemajuan Islam Malaysia (JAKIM)',
            18: 'Tunisia',
            19: 'Algeria',
            20: 'Kementerian Agama Republik Indonesia',
            21: 'Morocco',
            22: 'Comunidade Islamica de Lisboa',
            23: 'Ministry of Awqaf, Islamic Affairs and Holy Places, Jordan'
        }
    },
    ar: {
        title: '🕌 ساعة الصلاة الإسلامية',
        switchToDigital: 'تحويل إلى الرقمي',
        switchToPrayerClock: 'تحويل إلى ساعة الصلاة',
        languageButton: 'English',
        loading: 'جاري التحميل...',
        gettingLocation: '📍 جاري تحديد الموقع...',
        hijriLoading: '🌙 جاري التحميل...',
        hijriError: '🌙 فشل في تحميل التاريخ الهجري',
        nextPrayer: 'التالي',
        remaining: 'متبقي',
        complete: 'مكتمل',
        defaultLocation: 'مكة المكرمة، السعودية',
        // Weekdays for digital display
        weekdays: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
        // Months for digital display
        months: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
        // Prayer names (for display)
        prayers: {
            Fajr: 'الفجر',
            Sunrise: 'الشروق',
            Dhuhr: 'الظهر',
            Asr: 'العصر',
            Maghrib: 'المغرب',
            Isha: 'العشاء',
            Midnight: 'منتصف الليل'
        },
        // Settings menu translations
        settings: 'الإعدادات',
        language: 'اللغة',
        clockMode: 'وضع الساعة',
        digital: 'رقمية',
        analog: 'تناظرية',
        calculationMethod: 'طريقة الحساب',
        daylightSaving: 'التوقيت الصيفي',
        dstMinus1Hour: '- 1 ساعة',
        dstOff: 'معطل',
        dstPlus1Hour: '+ 1 ساعة',
        progressSection: 'إظهار قسم التقدم',
        progressHide: 'إخفاء',
        progressShow: 'إظهار',
        prayerTimeAdjustments: 'تعديل أوقات الصلاة (بالدقائق)',
        hijriOffset: 'تعديل التاريخ الهجري (بالأيام)',
        hijriMinus1Day: '- 1 يوم',
        hijriNoChange: 'بدون تغيير',
        hijriPlus1Day: '+ 1 يوم',
        save: 'حفظ',
        reset: 'إعادة تعيين',
        refresh: 'تحديث',
        // Calculation method names
        calculationMethods: {
            0: 'الشيعة الإثنا عشرية، معهد ليفا، قم',
            1: 'جامعة العلوم الإسلامية، كراتشي',
            2: 'الجمعية الإسلامية لأمريكا الشمالية (ISNA)',
            3: 'رابطة العالم الإسلامي',
            4: 'جامعة أم القرى، مكة المكرمة',
            5: 'الهيئة المصرية العامة للمساحة',
            7: 'معهد الجيوفيزياء، جامعة طهران',
            8: 'منطقة الخليج',
            9: 'الكويت',
            10: 'قطر',
            11: 'مجلس الأوقاف الإسلامية، سنغافورة',
            12: 'الاتحاد الإسلامي الفرنسي',
            13: 'رئاسة الشؤون الدينية، تركيا',
            14: 'الإدارة الروحية لمسلمي روسيا',
            15: 'لجنة مراقبة الهلال العالمية (Moonsighting.com)',
            16: 'دبي (تجريبي)',
            17: 'دائرة التنمية الإسلامية الماليزية (JAKIM)',
            18: 'تونس',
            19: 'الجزائر',
            20: 'وزارة الشؤون الدينية الإندونيسية',
            21: 'المغرب',
            22: 'الجالية الإسلامية في لشبونة',
            23: 'وزارة الأوقاف والشؤون الإسلامية والمقدسات، الأردن'
        }
    }
};

// Export the translations object for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Translations;
}
