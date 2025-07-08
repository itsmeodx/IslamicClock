class IslamicPrayerClock {
	constructor() {
		// Configuration
		this.config = {
			apiUrl: 'https://api.aladhan.com/v1/timingsByAddress',
			updateInterval: 1000,
			locationTimeout: 10000,
			cacheTimeout: 86400000, // 24 hours - keep cache longer
			defaultLocation: { lat: 21.4225, lng: 39.8262 }, // Mecca
			rateLimitDelay: 60000, // 1 minute delay between failed API calls
			maxRetries: 3, // Maximum API retry attempts
			defaultCalculationMethod: 2 // ISNA by default
		};

		// State
		this.state = {
			clockType: localStorage.getItem('clockType') || 'analog',
			language: localStorage.getItem('language') || 'en', // 'en' or 'ar'
			calculationMethod: localStorage.getItem('calculationMethod') || this.config.defaultCalculationMethod,
			daylightSaving: parseInt(localStorage.getItem('daylightSaving') || '0'), // -1, 0, or 1
			showProgress: localStorage.getItem('showProgress') !== 'false', // true by default
			prayerOffsets: JSON.parse(localStorage.getItem('prayerOffsets') || '{"Fajr":0,"Sunrise":0,"Dhuhr":0,"Asr":0,"Maghrib":0,"Isha":0}'),
			prayerTimes: null,
			originalPrayerTimes: null, // Store original times from API (before offsets/DST)
			location: null,
			animationId: null,
			lastFetchDate: null, // Track last fetch date
			isInitialized: false, // Track if initial setup is complete
			lastApiCall: null, // Track last API call for rate limiting
			retryCount: 0, // Track API retry attempts
			hijriDate: null, // Store Hijri date
			lastHijriFetch: null, // Track last Hijri date fetch
			lastHijriAttempt: null, // Track last Hijri fetch attempt
			// Performance optimization variables
			lastMinute: null, // Track last minute for redraw optimization
			lastHour: null, // Track last hour for redraw optimization
			forceRedraw: false, // Force redraw flag
			canvasCache: null // Cache for expensive canvas operations
		};

		// DOM Elements (cached)
		this.dom = {
			digitalDisplay: document.getElementById('digital-display'),
			analogDisplay: document.getElementById('analog-display'),
			timeDisplay: document.getElementById('time-display'),
			dateDisplay: document.getElementById('date-display'),
			canvas: document.getElementById('clock-canvas'),
			locationInfo: document.getElementById('location-info'),
			hijriDate: document.getElementById('hijri-date'),
			// Settings menu elements
			settingsToggle: document.getElementById('settings-toggle'),
			settingsPanel: document.getElementById('settings-panel'),
			languageToggle: document.getElementById('language-toggle'),
			clockModeToggle: document.getElementById('clock-mode-toggle'),
			calculationMethod: document.getElementById('calculation-method'),
			dstSelect: document.getElementById('dst-select'),
			progressToggle: document.getElementById('progress-toggle'),
			saveSettings: document.getElementById('save-settings'),
			resetSettings: document.getElementById('reset-settings'),
			refreshData: document.getElementById('refresh-data'),
			// Prayer offset inputs
			fajrOffset: document.getElementById('fajr-offset'),
			sunriseOffset: document.getElementById('sunrise-offset'),
			dhuhrOffset: document.getElementById('dhuhr-offset'),
			asrOffset: document.getElementById('asr-offset'),
			maghribOffset: document.getElementById('maghrib-offset'),
			ishaOffset: document.getElementById('isha-offset')
		};

		// Canvas context (cached)
		this.ctx = this.dom.canvas?.getContext('2d');

		// Prayer positions (fixed compass positions)
		this.prayerPositions = [
			{ name: 'Dhuhr', nameAr: 'الظهر', degree: 0, color: '#2ecc71' },
			{ name: 'Asr', nameAr: 'العصر', degree: 60, color: '#f39c12' },
			{ name: 'Maghrib', nameAr: 'المغرب', degree: 90, color: '#e74c3c' },
			{ name: 'Isha', nameAr: 'العشاء', degree: 120, color: '#9b59b6' },
			{ name: 'Midnight', nameAr: 'منتصف الليل', degree: 180, color: '#34495e' },
			{ name: 'Fajr', nameAr: 'الفجر', degree: 240, color: '#3498db' },
			{ name: 'Sunrise', nameAr: 'الشروق', degree: 270, color: '#ff9800' }
		];

		// Minor time markers (fixed positions relative to midnight at 180°)
		// First third of night: 60° before midnight (180° - 60° = 120°)
		// Last third of night: 60° after midnight (180° + 60° = 240°, but Fajr is already there, so use 210°)
		this.minorTimeMarkers = [
			{ name: 'Firstthird', nameAr: 'الثلث الأول', color: '#95a5a6', isMinor: true, degree: 135 }, // First third - between Isha and Midnight
			{ name: 'Lastthird', nameAr: 'الثلث الأخير', color: '#7f8c8d', isMinor: true, degree: 210 } // Last third - between Midnight and Fajr
		];

		// Hijri month names (1-12)
		this.hijriMonths = {
			en: ['Muḥarram', 'Ṣafar', 'Rabīʿ al-awwal', 'Rabīʿ al-thānī', 'Jumādā al-awwal', 'Jumādā al-thānī', 'Rajab', 'Shaʿbān', 'Ramaḍān', 'Shawwāl', 'Dhū al-Qaʿdah', 'Dhū al-Ḥijjah'],
			ar: ['مُحَرَّم', 'صَفَر', 'رَبِيع الأَوَّل', 'رَبِيع الثَّانِي', 'جُمَادَىٰ الأُولَىٰ', 'جُمَادَىٰ الآخِرَة', 'رَجَب', 'شَعْبَان', 'رَمَضَان', 'شَوَّال', 'ذُو القَعْدَة', 'ذُو الحِجَّة']
		};

		// Hijri weekday names (Sunday = 0, Monday = 1, etc.)
		this.hijriWeekdays = {
			en: ['Al Ahad', 'Al Athnayn', 'Al Thulatha', 'Al Arbiaa', 'Al Khamees', 'Al Jumuaa', 'Al Sabt'],
			ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
		};

		// Translation system
		this.translations = {
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
				dstMinus1Hour: '- ١ ساعة',
				dstOff: 'معطل',
				dstPlus1Hour: '+ ١ ساعة',
				progressSection: 'إظهار قسم التقدم',
				progressHide: 'إخفاء',
				progressShow: 'إظهار',
				prayerTimeAdjustments: 'تعديل أوقات الصلاة (بالدقائق)',
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

		this.init();
	}

	// Get translated text
	getText(key) {
		return this.translations[this.state.language][key] || this.translations.en[key] || key;
	} async init() {
		try {
			this.setupEventListeners();
			this.setupHighDPICanvas(); // Setup high-DPI canvas support
			this.updateLanguageDisplay(); // Set up translations first
			this.updateClockDisplay();
			await this.initializeLocation();
			await this.fetchPrayerTimes(); // This now also fetches Hijri date
			this.state.isInitialized = true;
			this.startClock();
		} catch (error) {
			console.error('Initialization error:', error);
			this.state.isInitialized = true;
			this.startClock(); // Start clock without prayer times - will only show current time
			// Try to fetch Hijri date even if other initialization fails
			this.fetchHijriDate(); // Fallback to separate call if needed
		}
	}

	setupHighDPICanvas() {
		if (!this.dom.canvas || !this.ctx) return;

		const canvas = this.dom.canvas;
		const rect = canvas.getBoundingClientRect();
		const devicePixelRatio = window.devicePixelRatio || 1;

		// Mobile detection for general optimizations
		const isMobile = window.innerWidth <= 768 ||
			('ontouchstart' in window || navigator.maxTouchPoints > 0);

		// Fallback to CSS computed dimensions if getBoundingClientRect returns 0
		let width = rect.width;
		let height = rect.height;

		if (width === 0 || height === 0) {
			const computedStyle = window.getComputedStyle(canvas);
			width = parseInt(computedStyle.width) || 500; // Default to 500px
			height = parseInt(computedStyle.height) || 550; // Default to 550px
		}

		// Ensure minimum dimensions
		width = Math.max(width, 200);
		height = Math.max(height, 220);

		// Mobile optimizations for all browsers
		if (isMobile) {
			// Limit device pixel ratio on mobile to prevent rendering issues
			const adjustedPixelRatio = Math.min(devicePixelRatio, 2);

			// Set the actual canvas size in memory (high resolution but limited)
			canvas.width = width * adjustedPixelRatio;
			canvas.height = height * adjustedPixelRatio;

			// Scale the drawing context
			this.ctx.scale(adjustedPixelRatio, adjustedPixelRatio);
			this.canvasScale = adjustedPixelRatio;
		} else {
			// Standard handling for desktop
			canvas.width = width * devicePixelRatio;
			canvas.height = height * devicePixelRatio;
			this.ctx.scale(devicePixelRatio, devicePixelRatio);
			this.canvasScale = devicePixelRatio;
		}

		// Scale the canvas back down using CSS
		canvas.style.width = width + 'px';
		canvas.style.height = height + 'px';

		// Mobile optimizations for all browsers
		if (isMobile) {
			canvas.style.imageRendering = 'crisp-edges';
			canvas.style.transform = 'translateZ(0)';
			canvas.style.willChange = 'transform';
		}
	} setupEventListeners() {
		// Settings menu event listeners
		this.dom.settingsToggle.addEventListener('click', () => this.toggleSettingsMenu());
		this.dom.clockModeToggle.addEventListener('change', () => this.toggleClockType());
		this.dom.saveSettings.addEventListener('click', () => this.saveSettings());
		this.dom.resetSettings.addEventListener('click', () => this.resetSettings());
		this.dom.refreshData.addEventListener('click', () => this.refreshData());

		// Close settings menu when clicking outside
		document.addEventListener('click', (e) => {
			if (!e.target.closest('.settings-menu')) {
				this.closeSettingsMenu();
			}
		});

		// Handle visibility changes to optimize performance
		document.addEventListener('visibilitychange', () => {
			if (document.hidden) {
				this.stopClock();
			} else {
				this.startClock();
			}
		});

		// Handle window resize for responsive canvas
		window.addEventListener('resize', this.debounce(() => {
			if (this.state.clockType === 'analog') {
				this.setupHighDPICanvas(); // Recalculate canvas for new size
				this.state.forceRedraw = true;
				this.drawAnalogClock();
			}
		}, 250));

		// Initialize settings UI
		this.initializeSettingsUI();
	}

	async initializeLocation() {
		try {
			const position = await this.getCurrentPosition();
			this.state.location = {
				lat: position.coords.latitude,
				lng: position.coords.longitude
			};

			// Get location name
			const locationName = await this.getLocationName(this.state.location);
			this.updateLocationDisplay(locationName);
		} catch (error) {
			console.log('Using default location (Mecca)');
			this.state.location = this.config.defaultLocation;
			this.updateLocationDisplay(this.getText('defaultLocation'));
		}
	}

	getCurrentPosition() {
		return new Promise((resolve, reject) => {
			if (!navigator.geolocation) {
				reject(new Error('Geolocation not supported'));
				return;
			}

			const timeout = setTimeout(() => {
				reject(new Error('Location timeout'));
			}, this.config.locationTimeout);

			navigator.geolocation.getCurrentPosition(
				(position) => {
					clearTimeout(timeout);
					resolve(position);
				},
				(error) => {
					clearTimeout(timeout);
					reject(error);
				},
				{ timeout: this.config.locationTimeout, enableHighAccuracy: true }
			);
		});
	}

	async getLocationName(location) {
		try {
			const response = await fetch(
				`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${location.lat}&longitude=${location.lng}&localityLanguage=en`
			);
			const data = await response.json();
			return `${data.locality || data.city || 'Unknown'}, ${data.countryName || 'Unknown'}`;
		} catch (error) {
			return 'Unknown Location';
		}
	} async fetchPrayerTimes(forceRefresh = false) {
		if (!this.state.location) return;

		const today = new Date().toDateString();
		const offsetsHash = btoa(JSON.stringify(this.state.prayerOffsets)).slice(0, 8); // Short hash
		const cacheKey = `prayer-times-${this.state.location.lat}-${this.state.location.lng}-${today}-${this.state.calculationMethod}-${this.state.daylightSaving}-${offsetsHash}`;

		// Always check cache first
		const cached = this.getFromCache(cacheKey);
		if (cached) {
			this.state.prayerTimes = cached;
			this.state.lastFetchDate = today;
			this.state.retryCount = 0; // Reset retry count on successful cache hit
			return;
		}

		// Skip API call if we already fetched today successfully
		if (this.state.lastFetchDate === today && this.state.prayerTimes) {
			return;
		}

		// Rate limiting: don't make API calls too frequently (unless forced refresh)
		const now = Date.now();
		if (!forceRefresh && this.state.lastApiCall && (now - this.state.lastApiCall) < this.config.rateLimitDelay) {
			console.log('Rate limit active, skipping API call');
			return;
		}

		// Check retry limit
		if (this.state.retryCount >= this.config.maxRetries) {
			console.log('Max API retries reached, will try again later');
			return;
		}

		try {
			console.log(`Fetching fresh prayer times from API... (attempt ${this.state.retryCount + 1})`);
			this.state.lastApiCall = now;
			this.state.retryCount++;

			const dateString = new Date().toISOString().split('T')[0].split('-').reverse().join('-'); // Convert YYYY-MM-DD to DD-MM-YYYY

			// Get location name for the address parameter
			let locationAddress = '';
			try {
				const locationName = await this.getLocationName(this.state.location);
				locationAddress = encodeURIComponent(locationName);
			} catch (error) {
				// Fallback to coordinates if location name fails
				locationAddress = `${this.state.location.lat},${this.state.location.lng}`;
			}

			const url = `${this.config.apiUrl}/${dateString}?address=${locationAddress}&method=${this.state.calculationMethod}`;

			const response = await fetch(url);
			const data = await response.json();

			if (data.code === 200 && data.data && data.data.timings) {
				// Store original times first (before any adjustments)
				this.state.originalPrayerTimes = { ...data.data.timings };

				// Apply prayer time offsets and daylight saving
				this.state.prayerTimes = this.applyTimeAdjustments(data.data.timings);
				this.state.lastFetchDate = today;
				this.state.retryCount = 0; // Reset retry count on success
				this.setCache(cacheKey, this.state.prayerTimes);
				console.log('Prayer times fetched and cached successfully');

				// Extract and process Hijri date from the same API response
				if (data.data.date && data.data.date.hijri) {
					this.processHijriDateFromAPI(data.data.date.hijri, today);
				}
			} else {
				throw new Error('Invalid API response structure');
			}
		} catch (error) {
			console.error(`Error fetching prayer times (attempt ${this.state.retryCount}):`, error);

			// If we have no data at all, try to get any cached data as fallback
			if (!this.state.prayerTimes) {
				console.log('Searching for any available cached prayer times...');

				// Try to find any cached prayer times for this location (any date)
				const locationCacheKeys = Object.keys(localStorage).filter(key =>
					key.startsWith(`prayer-times-${this.state.location.lat}-${this.state.location.lng}`)
				);

				for (const key of locationCacheKeys) {
					const fallbackCache = this.getFromCache(key);
					if (fallbackCache) {
						console.log(`Using fallback cache from: ${key}`);
						this.state.prayerTimes = fallbackCache;
						break;
					}
				}
			}
		}
	}

	// Process Hijri date from the prayer times API response
	processHijriDateFromAPI(hijriData, today) {
		try {
			// Get month index (1-12) and convert to array index (0-11)
			const monthIndex = parseInt(hijriData.month.number) - 1;

			// Get weekday from current date
			const gregorianDate = new Date();
			const weekdayIndex = gregorianDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

			// Use weekday from API if available, otherwise use our arrays
			const weekdayArabic = hijriData.weekday?.ar || this.hijriWeekdays.ar[weekdayIndex];
			const weekdayEnglish = hijriData.weekday?.en || this.hijriWeekdays.en[weekdayIndex];

			// Use month from API if available, otherwise use our arrays
			const monthArabic = hijriData.month?.ar || this.hijriMonths.ar[monthIndex];
			const monthEnglish = hijriData.month?.en || this.hijriMonths.en[monthIndex];

			this.state.hijriDate = {
				day: hijriData.day,
				month: monthEnglish,
				monthAr: monthArabic,
				year: hijriData.year,
				weekday: weekdayEnglish,
				weekdayAr: weekdayArabic
			};

			this.state.lastHijriFetch = today;
			const hijriCacheKey = `hijri-date-${today}`;
			this.setCache(hijriCacheKey, this.state.hijriDate);
			this.updateHijriDate();
		} catch (error) {
			console.error('Error processing Hijri date from API:', error);
		}
	}



	async fetchHijriDate() {
		const today = new Date().toDateString();
		const cacheKey = `hijri-date-${today}`;

		console.log('Fetching Hijri date...');

		// Check for any existing Hijri cache as fallback
		if (!this.state.hijriDate) {
			const fallbackCache = this.getAnyHijriCache();
			if (fallbackCache) {
				console.log('Using fallback Hijri cache:', fallbackCache);
				this.state.hijriDate = fallbackCache;
				this.updateHijriDate();
			}
		}

		try {
			const now = new Date();
			const dateString = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
			const url = `https://api.aladhan.com/v1/gToH/${dateString}`;

			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();

			if (data.code === 200 && data.data && data.data.hijri) {
				const hijriData = data.data.hijri;

				// Get month index (1-12) and convert to array index (0-11)
				const monthIndex = parseInt(hijriData.month.number) - 1;

				// Get weekday from current date
				const gregorianDate = new Date();
				const weekdayIndex = gregorianDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

				// Use our arrays to get the correct names
				const monthArabic = this.hijriMonths.ar[monthIndex];
				const monthEnglish = this.hijriMonths.en[monthIndex];
				const weekdayArabic = this.hijriWeekdays.ar[weekdayIndex];
				const weekdayEnglish = this.hijriWeekdays.en[weekdayIndex];

				this.state.hijriDate = {
					day: hijriData.day,
					month: monthEnglish,
					monthAr: monthArabic,
					year: hijriData.year,
					weekday: weekdayEnglish,
					weekdayAr: weekdayArabic
				};

				this.state.lastHijriFetch = today;
				this.setCache(cacheKey, this.state.hijriDate);
				this.updateHijriDate();
			} else {
				console.error('Invalid Hijri API response structure:', data);
				throw new Error('Invalid Hijri API response');
			}
		} catch (error) {
			console.error('Error fetching Hijri date:', error);

			// Don't show error message if we have fallback data
			if (!this.state.hijriDate) {
				this.dom.hijriDate.textContent = this.getText('hijriError');
			}

			// Reset the fetch date so we can try again later
			this.state.lastHijriFetch = null;
		}
	}

	toggleClockType() {
		this.state.clockType = this.state.clockType === 'digital' ? 'analog' : 'digital';
		localStorage.setItem('clockType', this.state.clockType);
		// Clear canvas cache when switching modes
		this.state.canvasCache = null;

		// Setup high-DPI canvas when switching to analog
		if (this.state.clockType === 'analog') {
			// Use setTimeout to ensure DOM is updated before canvas setup
			setTimeout(() => {
				this.setupHighDPICanvas();
				this.updateClockDisplay();
			}, 0);
		} else {
			this.updateClockDisplay();
		}
	}

	toggleLanguage() {
		this.state.language = this.state.language === 'en' ? 'ar' : 'en';
		localStorage.setItem('language', this.state.language);

		// Update only essential UI elements immediately
		this.updateEssentialLanguageElements();

		// Update Hijri date display with new language
		if (this.state.hijriDate) {
			this.updateHijriDate();
		}

		// Clear canvas cache and force complete redraw for analog clock
		if (this.state.clockType === 'analog') {
			this.state.canvasCache = null;
			this.state.forceRedraw = true;
			// Use setTimeout to ensure the language state is fully updated before redraw
			setTimeout(() => {
				this.drawAnalogClock();
			}, 0);
		}

		// Defer non-critical updates to avoid blocking
		setTimeout(() => {
			this.updateSettingsMenuText();
		}, 10);
	}

	updateEssentialLanguageElements() {
		// Update only the most critical elements immediately for fast response

		// Update HTML lang attribute and text direction
		document.documentElement.lang = this.state.language;
		if (this.state.language === 'ar') {
			document.documentElement.setAttribute('dir', 'rtl');
			document.body.style.textAlign = 'right';
		} else {
			document.documentElement.setAttribute('dir', 'ltr');
			document.body.style.textAlign = 'left';
		}

		// Update page title
		document.title = this.getText('title');
	}

	updateLanguageDisplay() {
		// Update page title
		document.title = this.getText('title');

		// Update HTML lang attribute
		document.documentElement.lang = this.state.language;

		// Update settings labels
		const settingsTitle = document.getElementById('settings-title');
		if (settingsTitle) settingsTitle.textContent = this.getText('settings');

		const languageLabel = document.getElementById('language-label');
		if (languageLabel) languageLabel.textContent = this.getText('language');

		const clockModeLabel = document.getElementById('clock-mode-label');
		if (clockModeLabel) clockModeLabel.textContent = this.getText('clockMode');

		const clockModeLeftLabel = document.getElementById('clock-mode-left-label');
		if (clockModeLeftLabel) clockModeLeftLabel.textContent = this.getText('digital');

		const clockModeRightLabel = document.getElementById('clock-mode-right-label');
		if (clockModeRightLabel) clockModeRightLabel.textContent = this.getText('analog');

		// Set initial loading text if empty or update if needed
		if (!this.dom.locationInfo.textContent || this.dom.locationInfo.textContent.includes('Getting location') || this.dom.locationInfo.textContent.includes('جاري تحديد الموقع')) {
			this.dom.locationInfo.textContent = this.getText('gettingLocation');
		}

		if (!this.dom.hijriDate.textContent || this.dom.hijriDate.textContent.includes('Loading') || this.dom.hijriDate.textContent.includes('جاري التحميل')) {
			this.dom.hijriDate.textContent = this.getText('hijriLoading');
		}

		if (this.dom.hijriDate.textContent.includes('Failed to load') || this.dom.hijriDate.textContent.includes('فشل في تحميل')) {
			this.dom.hijriDate.textContent = this.getText('hijriError');
		}

		// Update text direction for RTL/LTR
		if (this.state.language === 'ar') {
			document.documentElement.setAttribute('dir', 'rtl');
			document.body.style.textAlign = 'right';
		} else {
			document.documentElement.setAttribute('dir', 'ltr');
			document.body.style.textAlign = 'left';
		}

		// Update settings menu text
		this.updateSettingsMenuText();
	}

	updateSettingsMenuText() {
		// Update settings menu labels
		const settingsTitle = document.getElementById('settings-title');
		const languageLabel = document.getElementById('language-label');
		const calculationMethodLabel = document.getElementById('calculation-method-label');
		const daylightSavingLabel = document.getElementById('daylight-saving-label');
		const progressSectionLabel = document.getElementById('progress-section-label');
		const prayerAdjustmentsLabel = document.getElementById('prayer-adjustments-label');
		const saveBtn = document.getElementById('save-settings');
		const resetBtn = this.dom.resetSettings;
		const refreshBtn = this.dom.refreshData;

		if (settingsTitle) settingsTitle.textContent = this.getText('settings');
		if (languageLabel) languageLabel.textContent = this.getText('language') + ':';
		if (calculationMethodLabel) calculationMethodLabel.textContent = this.getText('calculationMethod') + ':';
		if (daylightSavingLabel) daylightSavingLabel.textContent = this.getText('daylightSaving') + ':';
		if (progressSectionLabel) progressSectionLabel.textContent = this.getText('progressSection') + ':';
		if (prayerAdjustmentsLabel) prayerAdjustmentsLabel.textContent = this.getText('prayerTimeAdjustments') + ':';
		if (saveBtn) saveBtn.textContent = this.getText('save');
		if (resetBtn) resetBtn.textContent = this.getText('reset');
		if (refreshBtn) refreshBtn.textContent = this.getText('refresh');

		// Update calculation method dropdown options
		const fajrLabel = document.getElementById('fajr-offset-label');
		const sunriseLabel = document.getElementById('sunrise-offset-label');
		const dhuhrLabel = document.getElementById('dhuhr-offset-label');
		const asrLabel = document.getElementById('asr-offset-label');
		const maghribLabel = document.getElementById('maghrib-offset-label');
		const ishaLabel = document.getElementById('isha-offset-label');

		if (fajrLabel) fajrLabel.textContent = this.getText('prayers').Fajr + ':';
		if (sunriseLabel) sunriseLabel.textContent = this.getText('prayers').Sunrise + ':';
		if (dhuhrLabel) dhuhrLabel.textContent = this.getText('prayers').Dhuhr + ':';
		if (asrLabel) asrLabel.textContent = this.getText('prayers').Asr + ':';
		if (maghribLabel) maghribLabel.textContent = this.getText('prayers').Maghrib + ':';
		if (ishaLabel) ishaLabel.textContent = this.getText('prayers').Isha + ':';

		// Update calculation method dropdown options
		const calculationMethodSelect = this.dom.calculationMethod;
		if (calculationMethodSelect) {
			const currentValue = calculationMethodSelect.value;
			const options = calculationMethodSelect.getElementsByTagName('option');
			const calculationMethods = this.getText('calculationMethods');

			for (let i = 0; i < options.length; i++) {
				const option = options[i];
				const methodId = option.value;
				if (calculationMethods[methodId]) {
					option.textContent = calculationMethods[methodId];
				}
			}
		}

		// Update daylight saving dropdown options
		const daylightSavingSelect = this.dom.dstSelect;
		if (daylightSavingSelect) {
			const options = daylightSavingSelect.getElementsByTagName('option');
			if (options[0]) options[0].textContent = this.getText('dstMinus1Hour');
			if (options[1]) options[1].textContent = this.getText('dstOff');
			if (options[2]) options[2].textContent = this.getText('dstPlus1Hour');
		}

		// Update progress toggle labels
		const progressHideLabel = document.getElementById('progress-hide-label');
		const progressShowLabel = document.getElementById('progress-show-label');
		if (progressHideLabel) progressHideLabel.textContent = this.getText('progressHide');
		if (progressShowLabel) progressShowLabel.textContent = this.getText('progressShow');
	}

	updateClockDisplay() {
		const isAnalog = this.state.clockType === 'analog';

		this.dom.digitalDisplay.style.display = isAnalog ? 'none' : 'block';
		this.dom.analogDisplay.style.display = isAnalog ? 'block' : 'none';

		if (isAnalog) {
			// Force redraw when switching to analog mode
			this.state.forceRedraw = true;
			this.drawAnalogClock();
		}
	}

	startClock() {
		this.stopClock();
		this.updateTime();
		this.state.animationId = setInterval(() => this.updateTime(), this.config.updateInterval);
	}

	stopClock() {
		if (this.state.animationId) {
			clearInterval(this.state.animationId);
			this.state.animationId = null;
		}
	}

	updateTime() {
		const now = new Date();
		const currentMinute = now.getMinutes();
		const currentHour = now.getHours();

		// Check if we need to refresh prayer times (new day)
		this.checkForNewDay();

		// Update digital display
		const timeString = this.formatTime(now);
		this.dom.timeDisplay.textContent = timeString;
		this.dom.dateDisplay.textContent = this.formatDate(now);

		// Update Hijri date if we have data
		if (this.state.hijriDate) {
			this.updateHijriDate();
		}

		// Optimize analog display updates - only redraw when minute changes or when forced
		if (this.state.clockType === 'analog') {
			// Only redraw if minute changed or if this is the first update
			const minuteChanged = this.state.lastMinute !== currentMinute;
			const hourChanged = this.state.lastHour !== currentHour;

			if (minuteChanged || hourChanged || this.state.forceRedraw || !this.state.lastMinute) {
				this.drawAnalogClock();
				this.state.lastMinute = currentMinute;
				this.state.lastHour = currentHour;
				this.state.forceRedraw = false;
			}
		}
	}

	formatTime(date) {
		const hours = date.getHours();
		const minutes = date.getMinutes();
		const seconds = date.getSeconds();

		// Convert to 12-hour format
		const hours12 = hours % 12 || 12;
		const ampm = hours >= 12 ? 'PM' : 'AM';

		// Format time string with consistent padding
		const timeString = `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

		if (this.state.language === 'ar') {
			// Arabic format with regular numerals and Arabic AM/PM
			const arabicAmPm = ampm === 'AM' ? 'ص' : 'م';
			return `${timeString} ${arabicAmPm}`;
		} else {
			// English format
			return `${timeString} ${ampm}`;
		}
	}

	formatDate(date) {
		const weekdays = this.translations[this.state.language].weekdays;
		const months = this.translations[this.state.language].months;

		const weekday = weekdays[date.getDay()];
		const month = months[date.getMonth()];
		const day = date.getDate();
		const year = date.getFullYear();

		if (this.state.language === 'ar') {
			// Arabic format with regular numerals: اليوم، اليوم الشهر السنة
			return `${weekday}، ${day} ${month} ${year}`;
		} else {
			// English format: Weekday, Month Day, Year
			return `${weekday}, ${month} ${day}, ${year}`;
		}
	}

	checkForNewDay() {
		if (!this.state.isInitialized) return;

		const today = new Date().toDateString();
		if (this.state.lastFetchDate && this.state.lastFetchDate !== today) {
			console.log('New day detected, refreshing prayer times and Hijri date...');
			this.state.retryCount = 0; // Reset retry count for new day
			this.fetchPrayerTimes(); // This will also refresh Hijri date
		}

		// Periodic retry if we don't have prayer times
		if (!this.state.prayerTimes && this.state.retryCount < this.config.maxRetries) {
			const now = Date.now();
			// Retry every 5 minutes if we have no data
			if (!this.state.lastApiCall || (now - this.state.lastApiCall) > (5 * 60 * 1000)) {
				console.log('No prayer times available, attempting to fetch...');
				this.fetchPrayerTimes(); // This will also fetch Hijri date
			}
		}

		// Fallback: Periodic retry for Hijri date if we still don't have it after prayer times fetch
		if (!this.state.hijriDate) {
			const now = Date.now();
			const lastAttempt = this.state.lastHijriAttempt || 0;
			// Retry every 5 minutes if we have no Hijri data
			if ((now - lastAttempt) > (5 * 60 * 1000)) {
				console.log('No Hijri date available, attempting separate fetch...');
				this.state.lastHijriAttempt = now;
				this.fetchHijriDate(); // Fallback to separate call
			}
		}
	} drawAnalogClock() {
		if (!this.ctx) return;

		const canvas = this.dom.canvas;
		const rect = canvas.getBoundingClientRect();

		// Use logical dimensions (what the user sees)
		let logicalWidth = rect.width;
		let logicalHeight = rect.height;

		// Fallback to computed style or default dimensions if rect is 0
		if (logicalWidth === 0 || logicalHeight === 0) {
			const computedStyle = window.getComputedStyle(canvas);
			logicalWidth = parseInt(computedStyle.width) || 500;
			logicalHeight = parseInt(computedStyle.height) || 550;
		}

		// Ensure minimum dimensions
		logicalWidth = Math.max(logicalWidth, 200);
		logicalHeight = Math.max(logicalHeight, 220);

		const centerX = logicalWidth / 2;
		const centerY = logicalHeight / 2;
		const radius = Math.max(Math.min(centerX, centerY - 25) - 50, 50); // Ensure minimum radius of 50

		// Clear canvas efficiently (use actual canvas dimensions)
		this.ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Calculate square border dimensions - make it more rectangular
		const squareWidth = (radius + 40) * 2;
		const squareHeight = logicalHeight - 20; // Use most of the canvas height
		const squareX = centerX - squareWidth / 2;
		const squareY = 10; // Small margin from top

		// Draw static elements (these don't change frequently)
		this.drawStaticElements(centerX, centerY, radius, squareX, squareY, squareWidth, squareHeight);

		// Draw dynamic elements (these change based on time and prayer progress)
		this.drawDynamicElements(centerX, centerY, radius, squareX, squareY, squareWidth, squareHeight);
	}

	drawStaticElements(centerX, centerY, radius, squareX, squareY, squareWidth, squareHeight) {
		// Draw outer square border with Bismillah
		this.drawSquareBorder(centerX, centerY, radius, squareX, squareY, squareWidth, squareHeight);

		// Draw clock face
		this.drawClockFace(centerX, centerY, radius);
		this.drawPrayerMarkers(centerX, centerY, radius);
	}

	drawDynamicElements(centerX, centerY, radius, squareX, squareY, squareWidth, squareHeight) {
		// Draw prayer progress hand and center circle
		this.drawClockHands(centerX, centerY, radius, squareX, squareY, squareWidth, squareHeight);
		this.drawCenterCircle(centerX, centerY);
	}

	drawSquareBorder(centerX, centerY, radius, squareX, squareY, squareWidth, squareHeight) {
		// Draw outer square border with Arabian theme colors
		this.ctx.save();

		// Outer decorative border with Arabian gold gradient
		const outerGradient = this.ctx.createLinearGradient(squareX, squareY, squareX + squareWidth, squareY + squareHeight);
		outerGradient.addColorStop(0, '#daa520');
		outerGradient.addColorStop(0.3, '#cd853f');
		outerGradient.addColorStop(0.7, '#8b4513');
		outerGradient.addColorStop(1, '#2d5016');

		this.ctx.fillStyle = outerGradient;
		this.ctx.fillRect(squareX - 6, squareY - 6, squareWidth + 12, squareHeight + 12);

		// Inner square with warm Arabian colors
		const innerGradient = this.ctx.createLinearGradient(squareX, squareY, squareX + squareWidth, squareY + squareHeight);
		innerGradient.addColorStop(0, 'rgba(255, 248, 220, 0.2)');
		innerGradient.addColorStop(0.5, 'rgba(245, 222, 179, 0.15)');
		innerGradient.addColorStop(1, 'rgba(218, 165, 32, 0.1)');

		this.ctx.fillStyle = innerGradient;
		this.ctx.fillRect(squareX, squareY, squareWidth, squareHeight);

		// Border lines with Arabian gold
		this.ctx.strokeStyle = '#8b4513';
		this.ctx.lineWidth = 3;
		this.ctx.strokeRect(squareX, squareY, squareWidth, squareHeight);

		// Draw Bismillah on the top border
		this.drawBismillahOnBorder(centerX, squareY, squareWidth);

		this.ctx.restore();
	} drawBismillahOnBorder(centerX, squareY, squareWidth) {
		// Background for Bismillah on top border - positioned inside the border
		const bismillahY = squareY + 10; // Move inside the border
		const bismillahWidth = squareWidth * 0.7;
		const bismillahHeight = 30;

		this.ctx.fillStyle = 'rgba(255, 248, 220, 0.98)';
		this.ctx.fillRect(centerX - bismillahWidth / 2, bismillahY, bismillahWidth, bismillahHeight);
		this.ctx.strokeStyle = 'rgba(139, 69, 19, 0.8)';
		this.ctx.lineWidth = 2;
		this.ctx.strokeRect(centerX - bismillahWidth / 2, bismillahY, bismillahWidth, bismillahHeight);

		// Arabic Bismillah with shadow effect
		this.ctx.shadowColor = 'rgba(139, 69, 19, 0.4)';
		this.ctx.shadowBlur = 3;
		this.ctx.shadowOffsetX = 1;
		this.ctx.shadowOffsetY = 1;

		this.ctx.fillStyle = '#8b4513';
		this.ctx.font = 'bold 14px Arial';
		this.ctx.textAlign = 'center';
		this.ctx.textBaseline = 'middle';
		this.ctx.fillText('بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ', centerX, bismillahY + 10);

		// English translation (always show English regardless of language setting)
		this.ctx.shadowBlur = 0;
		this.ctx.fillStyle = '#cd853f';
		this.ctx.font = 'italic 9px Arial';
		this.ctx.fillText('In the name of Allah, the Most Gracious, the Most Merciful', centerX, bismillahY + 23);
	}

	drawClockFace(centerX, centerY, radius) {
		// Ensure radius is valid for gradient creation
		if (radius < 10) {
			console.warn('Radius too small for clock face:', radius);
			return;
		}

		// Use cached gradients if available, otherwise create them
		if (!this.state.canvasCache) {
			this.state.canvasCache = {};
		}

		// Outer decorative border with Arabian theme colors
		if (!this.state.canvasCache.outerGradient) {
			// Ensure gradient radii are positive
			const innerRadius = Math.max(radius - 5, 1);
			const outerRadius = Math.max(radius + 10, innerRadius + 1);
			this.state.canvasCache.outerGradient = this.ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, outerRadius);
			this.state.canvasCache.outerGradient.addColorStop(0, '#daa520');
			this.state.canvasCache.outerGradient.addColorStop(0.5, '#cd853f');
			this.state.canvasCache.outerGradient.addColorStop(1, '#8b4513');
		}

		this.ctx.beginPath();
		this.ctx.arc(centerX, centerY, radius + 8, 0, 2 * Math.PI);
		this.ctx.fillStyle = this.state.canvasCache.outerGradient;
		this.ctx.fill();

		// Main clock face with warm Arabian gradient
		if (!this.state.canvasCache.mainGradient) {
			// Ensure radius is positive for gradient
			const gradientRadius = Math.max(radius, 1);
			this.state.canvasCache.mainGradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, gradientRadius);
			this.state.canvasCache.mainGradient.addColorStop(0, 'rgba(255, 248, 220, 0.98)');
			this.state.canvasCache.mainGradient.addColorStop(0.3, 'rgba(250, 240, 210, 0.95)');
			this.state.canvasCache.mainGradient.addColorStop(0.7, 'rgba(245, 222, 179, 0.9)');
			this.state.canvasCache.mainGradient.addColorStop(0.9, 'rgba(238, 203, 173, 0.85)');
			this.state.canvasCache.mainGradient.addColorStop(1, 'rgba(222, 184, 135, 0.8)');
		}

		this.ctx.beginPath();
		this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
		this.ctx.fillStyle = this.state.canvasCache.mainGradient;
		this.ctx.fill();

		// Elegant border with Arabian brown
		this.ctx.strokeStyle = '#8b4513';
		this.ctx.lineWidth = 4;
		this.ctx.stroke();

		// Inner decorative circles with Arabian gold tones (simplified)
		this.ctx.strokeStyle = 'rgba(218, 165, 32, 0.3)';
		this.ctx.lineWidth = 1;
		for (let i = 1; i <= 2; i++) { // Reduced from 3 to 2 circles
			this.ctx.beginPath();
			this.ctx.arc(centerX, centerY, radius - (i * 18), 0, 2 * Math.PI);
			this.ctx.stroke();
		}

		// Simplified hour markers
		this.ctx.strokeStyle = 'rgba(139, 69, 19, 0.4)';
		this.ctx.lineWidth = 1;
		for (let i = 0; i < 12; i += 3) { // Only show 4 main markers instead of 24
			const angle = (i * 30) * Math.PI / 180; // 30 degrees for each main hour
			const startRadius = radius - 20;
			const endRadius = radius - 3;

			this.ctx.beginPath();
			this.ctx.moveTo(
				centerX + Math.cos(angle) * startRadius,
				centerY + Math.sin(angle) * startRadius
			);
			this.ctx.lineTo(
				centerX + Math.cos(angle) * endRadius,
				centerY + Math.sin(angle) * endRadius
			);
			this.ctx.lineWidth = 2;
			this.ctx.stroke();
		}

		// Add Islamic geometric pattern in center (simplified)
		this.drawIslamicGeometry(centerX, centerY, 35);
	}

	drawIslamicGeometry(centerX, centerY, size) {
		// Simplified 8-pointed star (Khatam) with Arabian theme colors
		this.ctx.save();

		// Use cached gradient if available
		if (!this.state.canvasCache.starGradient) {
			this.state.canvasCache.starGradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size);
			this.state.canvasCache.starGradient.addColorStop(0, 'rgba(218, 165, 32, 0.9)');
			this.state.canvasCache.starGradient.addColorStop(0.7, 'rgba(205, 133, 63, 0.6)');
			this.state.canvasCache.starGradient.addColorStop(1, 'rgba(139, 69, 19, 0.3)');
		}

		// Simplified star shape with fewer points for better performance
		this.ctx.beginPath();
		for (let i = 0; i < 8; i++) { // Reduced from 16 to 8 points
			const angle = (i * 45) * Math.PI / 180;
			const radius = i % 2 === 0 ? size * 0.8 : size * 0.4;
			const x = centerX + Math.cos(angle) * radius;
			const y = centerY + Math.sin(angle) * radius;

			if (i === 0) {
				this.ctx.moveTo(x, y);
			} else {
				this.ctx.lineTo(x, y);
			}
		}
		this.ctx.closePath();

		this.ctx.fillStyle = this.state.canvasCache.starGradient;
		this.ctx.fill();
		this.ctx.strokeStyle = '#8b4513';
		this.ctx.lineWidth = 2;
		this.ctx.stroke();

		// Inner ornamental circle
		this.ctx.beginPath();
		this.ctx.arc(centerX, centerY, size * 0.25, 0, 2 * Math.PI);
		this.ctx.fillStyle = '#daa520';
		this.ctx.fill();
		this.ctx.strokeStyle = '#8b4513';
		this.ctx.lineWidth = 1;
		this.ctx.stroke();

		this.ctx.restore();
	}

	calculateMinorMarkerPositions() {
		if (!this.state.prayerTimes) return [];

		const minorMarkers = [];

		this.minorTimeMarkers.forEach(marker => {
			if (this.state.prayerTimes[marker.name]) {
				const time = this.state.prayerTimes[marker.name];
				const [hours, minutes] = time.split(':').map(Number);
				const totalMinutes = hours * 60 + minutes;

				// Convert time to degrees (24 hours = 360 degrees)
				// 0 degrees = noon (12:00), so adjust accordingly
				const degree = ((totalMinutes - 12 * 60) * 360 / (24 * 60)) % 360;
				const adjustedDegree = degree < 0 ? degree + 360 : degree;

				minorMarkers.push({
					...marker,
					degree: adjustedDegree,
					time: time
				});
			}
		});

		return minorMarkers;
	}

	drawPrayerMarkers(centerX, centerY, radius) {
		// Draw main prayer markers
		this.prayerPositions.forEach((prayer) => {
			const angle = (prayer.degree - 90) * Math.PI / 180;
			const markerRadius = radius - 50; // Adjusted for larger canvas
			const x = centerX + Math.cos(angle) * markerRadius;
			const y = centerY + Math.sin(angle) * markerRadius;

			// Simplified prayer marker (removed glow effect for performance)
			this.ctx.save();

			// Main prayer marker circle (scaled up)
			this.ctx.beginPath();
			this.ctx.arc(x, y, 10, 0, 2 * Math.PI);

			// Simplified solid color instead of gradient
			this.ctx.fillStyle = prayer.color;
			this.ctx.fill();

			this.ctx.strokeStyle = '#ffffff';
			this.ctx.lineWidth = 2;
			this.ctx.stroke();

			// Inner highlight
			this.ctx.beginPath();
			this.ctx.arc(x, y, 5, 0, 2 * Math.PI);
			this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
			this.ctx.fill();

			this.ctx.restore();

			// Prayer time with elegant display - positioned outside markers
			if (this.state.prayerTimes && this.state.prayerTimes[prayer.name]) {
				const timeRadius = radius - 15;
				const timeX = centerX + Math.cos(angle) * timeRadius;
				const timeY = centerY + Math.sin(angle) * timeRadius;

				// Time background with Arabian theme (scaled up)
				this.ctx.fillStyle = 'rgba(139, 69, 19, 0.95)';
				this.ctx.fillRect(timeX - 18, timeY - 6, 36, 12);
				this.ctx.strokeStyle = '#daa520';
				this.ctx.lineWidth = 1;
				this.ctx.strokeRect(timeX - 18, timeY - 6, 36, 12);

				this.ctx.fillStyle = '#fff8dc';
				this.ctx.font = 'bold 9px Arial';
				this.ctx.textAlign = 'center';
				this.ctx.textBaseline = 'middle';
				const prayerTimeText = this.state.prayerTimes[prayer.name];
				// Use regular numerals for prayer times in all languages
				this.ctx.fillText(prayerTimeText, timeX, timeY);
			}

			// Arabic name with elegant styling - positioned inside with better spacing
			// Adjust positioning for Dhuhr and Midnight to be closer to their markers
			let arabicRadius = radius - 85;
			if (prayer.name === 'Dhuhr' || prayer.name === 'Midnight') {
				arabicRadius = radius - 70; // Move closer to marker (was 85, now 70)
			}
			const arabicX = centerX + Math.cos(angle) * arabicRadius;
			const arabicY = centerY + Math.sin(angle) * arabicRadius;

			this.ctx.fillStyle = prayer.color;
			this.ctx.font = 'bold 12px Arial';
			this.ctx.textAlign = 'center';
			this.ctx.textBaseline = 'middle';
			this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
			this.ctx.lineWidth = 1;
			const prayerName = this.state.language === 'ar' ? prayer.nameAr : (this.getText('prayers')[prayer.name] || prayer.name);
			this.ctx.strokeText(prayerName, arabicX, arabicY);
			this.ctx.fillText(prayerName, arabicX, arabicY);
		});

		// Draw minor markers (Firstthird and Lastthird) with fixed positions
		this.minorTimeMarkers.forEach((marker) => {
			const angle = (marker.degree - 90) * Math.PI / 180;

			// Position minor markers at the same radius as prayer markers
			const markerRadius = radius - 50; // Same position as main prayer markers
			const x = centerX + Math.cos(angle) * markerRadius;
			const y = centerY + Math.sin(angle) * markerRadius;

			this.ctx.save();

			// Smaller minor marker circle with distinct style
			this.ctx.beginPath();
			this.ctx.arc(x, y, 5, 0, 2 * Math.PI);

			// Use marker color with slight transparency
			this.ctx.fillStyle = marker.color;
			this.ctx.fill();

			this.ctx.strokeStyle = '#ffffff';
			this.ctx.lineWidth = 1;
			this.ctx.stroke();

			// Smaller inner highlight
			this.ctx.beginPath();
			this.ctx.arc(x, y, 2.5, 0, 2 * Math.PI);
			this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
			this.ctx.fill();

			this.ctx.restore();

			// Minor marker name - positioned closer to markers but with proper spacing
			const nameRadius = radius - 75; // Balanced position between markers and prayer names
			const nameX = centerX + Math.cos(angle) * nameRadius;
			const nameY = centerY + Math.sin(angle) * nameRadius;

			this.ctx.fillStyle = marker.color;
			this.ctx.font = 'bold 8px Arial';
			this.ctx.textAlign = 'center';
			this.ctx.textBaseline = 'middle';
			this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
			this.ctx.lineWidth = 0.5;
			const markerName = this.state.language === 'ar' ? marker.nameAr : marker.name;
			this.ctx.strokeText(markerName, nameX, nameY);
			this.ctx.fillText(markerName, nameX, nameY);
		});
	}



	drawClockHands(centerX, centerY, radius, squareX, squareY, squareWidth, squareHeight) {
		const prayerProgress = this.getPrayerProgress();

		// Only draw the main prayer progress hand if we have prayer times
		if (prayerProgress) {
			const progressAngle = (prayerProgress.progressDegree - 90) * Math.PI / 180;

			// Simplified main hand design (removed shadow for performance)
			this.ctx.save();

			// Main hand body with solid color instead of gradient
			const handLength = radius * 0.75;
			const handWidth = 8;

			// Draw the main hand with tapered design
			this.ctx.beginPath();
			this.ctx.lineWidth = handWidth;
			this.ctx.lineCap = 'round';
			this.ctx.strokeStyle = '#cd853f'; // Solid color instead of gradient
			this.ctx.moveTo(centerX, centerY);
			this.ctx.lineTo(
				centerX + Math.cos(progressAngle) * handLength,
				centerY + Math.sin(progressAngle) * handLength
			);
			this.ctx.stroke();

			// Hand tip decoration
			const tipX = centerX + Math.cos(progressAngle) * handLength;
			const tipY = centerY + Math.sin(progressAngle) * handLength;

			this.ctx.beginPath();
			this.ctx.arc(tipX, tipY, 6, 0, 2 * Math.PI);
			this.ctx.fillStyle = '#daa520';
			this.ctx.fill();
			this.ctx.strokeStyle = '#8b4513';
			this.ctx.lineWidth = 2;
			this.ctx.stroke();

			this.ctx.restore();

			// Prayer progress information - only show if enabled
			if (this.state.showProgress) {
				this.drawProgressInfo(prayerProgress, squareX, squareY, squareWidth, squareHeight);
			}
		}
		// If no prayer times available, don't show any loading message
	} drawProgressInfo(prayerProgress, squareX, squareY, squareWidth, squareHeight) {
		// Position in bottom left corner of the square border
		const progressWidth = 140;
		const progressHeight = 50;
		const progressX = squareX + 12; // 12px margin from left edge
		const progressY = squareY + squareHeight - progressHeight - 12; // 12px margin from bottom edge

		// Background for progress info with Arabian theme
		this.ctx.fillStyle = 'rgba(255, 248, 220, 0.98)';
		this.ctx.strokeStyle = 'rgba(139, 69, 19, 0.4)';
		this.ctx.lineWidth = 2;
		this.ctx.fillRect(progressX, progressY, progressWidth, progressHeight);
		this.ctx.strokeRect(progressX, progressY, progressWidth, progressHeight);

		// Next prayer name with Arabian theme
		this.ctx.fillStyle = '#8b4513';
		this.ctx.font = 'bold 12px Arial';
		this.ctx.textAlign = 'center';
		this.ctx.textBaseline = 'middle';
		const nextPrayerName = this.getText('prayers')[prayerProgress.nextPrayer] || prayerProgress.nextPrayer;
		this.ctx.fillText(`${this.getText('nextPrayer')}: ${nextPrayerName}`, progressX + progressWidth / 2, progressY + 13);

		// Time remaining to next prayer
		this.ctx.fillStyle = '#cd853f';
		this.ctx.font = '11px Arial';
		let timeRemainingText = `${prayerProgress.timeRemaining} ${this.getText('remaining')}`;
		// Note: prayerProgress.timeRemaining is already formatted with Arabic numerals from formatTimeRemaining
		this.ctx.fillText(timeRemainingText, progressX + progressWidth / 2, progressY + 27);

		// Progress percentage with Arabian theme
		this.ctx.fillStyle = '#daa520';
		this.ctx.font = 'bold 10px Arial';
		const progressText = `${prayerProgress.progressPercentage}% ${this.getText('complete')}`;
		// Use regular numerals for progress text in all languages
		this.ctx.fillText(progressText, progressX + progressWidth / 2, progressY + 40);
	}





	drawCenterCircle(centerX, centerY) {
		// Simplified center circle with Arabian theme colors (removed shadows for performance)
		this.ctx.save();

		// Outer ring using Arabian theme
		this.ctx.beginPath();
		this.ctx.arc(centerX, centerY, 18, 0, 2 * Math.PI);
		this.ctx.fillStyle = '#8b4513';
		this.ctx.fill();

		// Middle ring with Arabian theme
		this.ctx.beginPath();
		this.ctx.arc(centerX, centerY, 14, 0, 2 * Math.PI);
		this.ctx.fillStyle = '#daa520';
		this.ctx.fill();
		this.ctx.strokeStyle = '#8b4513';
		this.ctx.lineWidth = 2;
		this.ctx.stroke();

		// Inner highlight circle with simplified gradient
		this.ctx.beginPath();
		this.ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);

		// Use cached gradient if available
		if (!this.state.canvasCache.centerGradient) {
			this.state.canvasCache.centerGradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 10);
			this.state.canvasCache.centerGradient.addColorStop(0, 'rgba(255, 248, 220, 0.9)');
			this.state.canvasCache.centerGradient.addColorStop(0.7, 'rgba(218, 165, 32, 0.7)');
			this.state.canvasCache.centerGradient.addColorStop(1, 'rgba(139, 69, 19, 0.9)');
		}

		this.ctx.fillStyle = this.state.canvasCache.centerGradient;
		this.ctx.fill();

		// Islamic symbol in center with Arabian theme
		this.ctx.fillStyle = '#8b4513';
		this.ctx.font = 'bold 14px Arial';
		this.ctx.textAlign = 'center';
		this.ctx.textBaseline = 'middle';
		this.ctx.fillText('☪', centerX, centerY);

		this.ctx.restore();
	}

	getPrayerProgress() {
		if (!this.state.prayerTimes) return null;

		const now = new Date();
		const currentMinutes = now.getHours() * 60 + now.getMinutes();

		// Convert prayer times to minutes and match with positions
		const prayerSchedule = this.prayerPositions
			.filter(p => p.name !== 'Midnight')
			.map(prayer => {
				const time = this.state.prayerTimes[prayer.name];
				if (time) {
					const [hours, minutes] = time.split(':').map(Number);
					return {
						...prayer,
						totalMinutes: hours * 60 + minutes
					};
				}
				return null;
			})
			.filter(Boolean)
			.sort((a, b) => a.totalMinutes - b.totalMinutes);

		// Add midnight as reference
		prayerSchedule.push({
			name: 'Midnight',
			degree: 180,
			totalMinutes: 0 // Represents start of day
		});

		// Find current prayer period
		let currentPrayer = null;
		let nextPrayer = null;

		for (let i = 0; i < prayerSchedule.length; i++) {
			const prayer = prayerSchedule[i];
			const nextIndex = (i + 1) % prayerSchedule.length;
			const next = prayerSchedule[nextIndex];

			if (prayer.totalMinutes <= currentMinutes &&
				(next.totalMinutes > currentMinutes || next.totalMinutes === 0)) {
				currentPrayer = prayer;
				nextPrayer = next;
				break;
			}
		}

		if (!currentPrayer || !nextPrayer) return null;

		// Calculate progress
		const prayerDuration = nextPrayer.totalMinutes > currentPrayer.totalMinutes
			? nextPrayer.totalMinutes - currentPrayer.totalMinutes
			: (24 * 60) - currentPrayer.totalMinutes + nextPrayer.totalMinutes;

		const elapsed = currentMinutes >= currentPrayer.totalMinutes
			? currentMinutes - currentPrayer.totalMinutes
			: (24 * 60) - currentPrayer.totalMinutes + currentMinutes;

		const progressPercentage = (elapsed / prayerDuration) * 100;

		// Calculate hand position
		const degreeDifference = nextPrayer.degree > currentPrayer.degree
			? nextPrayer.degree - currentPrayer.degree
			: 360 - currentPrayer.degree + nextPrayer.degree;

		const progressDegree = currentPrayer.degree + (degreeDifference * progressPercentage / 100);

		return {
			currentPrayer: currentPrayer.name,
			nextPrayer: nextPrayer.name,
			progressPercentage: Math.round(progressPercentage),
			progressDegree: progressDegree % 360,
			timeRemaining: this.formatTimeRemaining(prayerDuration - elapsed)
		};
	}

	formatTimeRemaining(minutes) {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;

		let timeString;
		if (this.state.language === 'ar') {
			// Use Arabic abbreviations with regular numerals
			if (hours > 0) {
				// س = first letter of ساعة (hour), د = first letter of دقيقة (minute)
				timeString = `${hours}س ${mins}د`;
			} else {
				// د = first letter of دقيقة (minute)
				timeString = `${mins}د`;
			}
		} else {
			// English format with abbreviations
			timeString = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
		}

		return timeString;
	}

	updateLocationDisplay(locationName) {
		this.dom.locationInfo.textContent = `📍 ${locationName}`;
	}

	// Settings Menu Methods
	initializeSettingsUI() {
		// Set current values in the UI
		this.dom.languageToggle.checked = this.state.language === 'ar';
		this.dom.clockModeToggle.checked = this.state.clockType === 'analog';
		this.dom.calculationMethod.value = this.state.calculationMethod;
		this.dom.dstSelect.value = this.state.daylightSaving.toString();
		this.dom.progressToggle.checked = this.state.showProgress;

		// Set prayer offsets
		this.dom.fajrOffset.value = this.state.prayerOffsets.Fajr;
		this.dom.sunriseOffset.value = this.state.prayerOffsets.Sunrise;
		this.dom.dhuhrOffset.value = this.state.prayerOffsets.Dhuhr;
		this.dom.asrOffset.value = this.state.prayerOffsets.Asr;
		this.dom.maghribOffset.value = this.state.prayerOffsets.Maghrib;
		this.dom.ishaOffset.value = this.state.prayerOffsets.Isha;
	}

	toggleSettingsMenu() {
		this.dom.settingsPanel.classList.toggle('show');
	}

	closeSettingsMenu() {
		this.dom.settingsPanel.classList.remove('show');
	}

	async saveSettings() {
		// Get values from UI
		const newLanguage = this.dom.languageToggle.checked ? 'ar' : 'en';
		const newCalculationMethod = this.dom.calculationMethod.value;
		const newDaylightSaving = parseInt(this.dom.dstSelect.value);
		const newShowProgress = this.dom.progressToggle.checked;
		const newOffsets = {
			Fajr: parseInt(this.dom.fajrOffset.value) || 0,
			Sunrise: parseInt(this.dom.sunriseOffset.value) || 0,
			Dhuhr: parseInt(this.dom.dhuhrOffset.value) || 0,
			Asr: parseInt(this.dom.asrOffset.value) || 0,
			Maghrib: parseInt(this.dom.maghribOffset.value) || 0,
			Isha: parseInt(this.dom.ishaOffset.value) || 0
		};

		// Check if settings have changed
		const languageChanged = newLanguage !== this.state.language;
		const methodChanged = newCalculationMethod !== this.state.calculationMethod;
		const dstChanged = newDaylightSaving !== this.state.daylightSaving;
		const progressChanged = newShowProgress !== this.state.showProgress;
		const offsetsChanged = JSON.stringify(newOffsets) !== JSON.stringify(this.state.prayerOffsets);

		console.log('Settings change detection:', {
			languageChanged,
			methodChanged: methodChanged ? `${this.state.calculationMethod} -> ${newCalculationMethod}` : false,
			dstChanged,
			progressChanged,
			offsetsChanged
		});

		// Store old values for DST calculation before updating state
		const oldDaylightSaving = this.state.daylightSaving;

		// Update state
		this.state.language = newLanguage;
		this.state.calculationMethod = newCalculationMethod;
		this.state.daylightSaving = newDaylightSaving;
		this.state.showProgress = newShowProgress;
		this.state.prayerOffsets = newOffsets;

		// Save to localStorage
		localStorage.setItem('language', newLanguage);
		localStorage.setItem('calculationMethod', newCalculationMethod);
		localStorage.setItem('daylightSaving', newDaylightSaving.toString());
		localStorage.setItem('showProgress', newShowProgress.toString());
		localStorage.setItem('prayerOffsets', JSON.stringify(newOffsets));

		// Update UI if language changed
		if (languageChanged) {
			this.updateLanguageDisplay();
			if (this.state.hijriDate) {
				this.updateHijriDate();
			}
			// Clear canvas cache when language changes to regenerate gradients
			this.state.canvasCache = null;
			// Force immediate redraw of analog clock for language change
			if (this.state.clockType === 'analog') {
				this.state.forceRedraw = true;
				this.drawAnalogClock();
			}
		}		// Refresh prayer times if method, DST, or offsets changed
		if (methodChanged || dstChanged || offsetsChanged) {
			// For immediate feedback with DST changes
			if (dstChanged && !methodChanged && !offsetsChanged && this.state.originalPrayerTimes) {
				console.log('DST changed, reapplying adjustments to original times');

				// Reapply all adjustments with new DST using original times
				this.state.prayerTimes = this.applyTimeAdjustments(this.state.originalPrayerTimes);

				// Update cache with new adjusted times
				const today = new Date().toDateString();
				const offsetsHash = btoa(JSON.stringify(this.state.prayerOffsets)).slice(0, 8);
				const newCacheKey = `prayer-times-${this.state.location?.lat}-${this.state.location?.lng}-${today}-${this.state.calculationMethod}-${this.state.daylightSaving}-${offsetsHash}`;
				this.setCache(newCacheKey, this.state.prayerTimes);

				console.log('Prayer times adjusted with new DST:', this.state.prayerTimes);

				// Immediately redraw the analog clock
				if (this.state.clockType === 'analog') {
					this.state.forceRedraw = true;
					this.drawAnalogClock();
				}
			}
			// For offset changes, immediately reapply all adjustments to existing times
			else if (offsetsChanged && !methodChanged && this.state.originalPrayerTimes) {
				console.log('Offsets changed, reapplying adjustments to original times');

				// Reapply all adjustments with new offsets using original times
				this.state.prayerTimes = this.applyTimeAdjustments(this.state.originalPrayerTimes);

				// Update cache with new adjusted times
				const today = new Date().toDateString();
				const offsetsHash = btoa(JSON.stringify(this.state.prayerOffsets)).slice(0, 8);
				const newCacheKey = `prayer-times-${this.state.location?.lat}-${this.state.location?.lng}-${today}-${this.state.calculationMethod}-${this.state.daylightSaving}-${offsetsHash}`;
				this.setCache(newCacheKey, this.state.prayerTimes);

				console.log('Prayer times adjusted with new offsets:', this.state.prayerTimes);

				// Immediately redraw the analog clock
				if (this.state.clockType === 'analog') {
					this.state.forceRedraw = true;
					this.drawAnalogClock();
				}
			}

			// Only make API calls if calculation method changed
			// For DST and offset changes, we can adjust existing times without new API calls
			if (methodChanged) {
				// Clear cached prayer times and fetch fresh ones for method changes
				this.clearPrayerTimesCache();
				this.state.lastFetchDate = null; // Force refresh
				this.state.prayerTimes = null; // Clear current prayer times to force fetch
				this.state.retryCount = 0;

				console.log('Calculation method changed, fetching new prayer times...');
				await this.fetchPrayerTimes(true); // Force refresh bypassing rate limit
				console.log('New prayer times fetched, redrawing clock...');

				// Force immediate redraw for method changes
				if (this.state.clockType === 'analog') {
					this.state.forceRedraw = true;
					this.drawAnalogClock();
				}
			} else {
				// For DST and offset changes, just redraw with the adjusted times we already computed above
				if ((dstChanged || offsetsChanged) && this.state.clockType === 'analog') {
					this.state.forceRedraw = true;
					this.drawAnalogClock();
				}
			}
		}

		// Redraw analog clock if progress toggle changed
		if (progressChanged && this.state.clockType === 'analog') {
			this.state.forceRedraw = true;
			this.drawAnalogClock();
		}

		// Close settings menu
		this.closeSettingsMenu();
	}

	resetSettings() {
		// Reset to defaults
		this.state.language = 'en';
		this.state.calculationMethod = this.config.defaultCalculationMethod;
		this.state.daylightSaving = 0;
		this.state.showProgress = true;
		this.state.prayerOffsets = {
			Fajr: 0, Sunrise: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0
		};

		// Update localStorage
		localStorage.setItem('language', 'en');
		localStorage.setItem('calculationMethod', this.config.defaultCalculationMethod);
		localStorage.setItem('daylightSaving', '0');
		localStorage.setItem('showProgress', 'true');
		localStorage.setItem('prayerOffsets', JSON.stringify(this.state.prayerOffsets));

		// Update UI
		this.initializeSettingsUI();
		this.updateLanguageDisplay();

		// Force refresh prayer times
		this.state.lastFetchDate = null;
		this.state.prayerTimes = null;
		this.state.retryCount = 0;
		this.fetchPrayerTimes(true); // Force refresh bypassing rate limit

		// Close settings menu
		this.closeSettingsMenu();
	}

	async refreshData() {
		try {
			// Show loading state
			if (this.dom.refreshData) {
				this.dom.refreshData.disabled = true;
				this.dom.refreshData.textContent = this.getText('loading').replace('...', '');
			}

			// Clear all prayer times cache
			this.clearPrayerTimesCache();
			this.state.lastFetchDate = null;
			this.state.prayerTimes = null;
			this.state.retryCount = 0;

			// Clear Hijri date cache
			const hijriKeys = Object.keys(localStorage).filter(key => key.startsWith('hijri-date-'));
			hijriKeys.forEach(key => localStorage.removeItem(key));
			this.state.hijriDate = null;
			this.state.lastHijriFetch = null;

			// Force refresh prayer times (which will also fetch Hijri date)
			console.log('Manual refresh: Fetching fresh prayer times and Hijri date...');
			await this.fetchPrayerTimes(true);

			// If Hijri date wasn't included in the response, try separate call as fallback
			if (!this.state.hijriDate) {
				console.log('Hijri date not found in prayer times response, trying separate fetch...');
				await this.fetchHijriDate();
			}

			// Force redraw
			if (this.state.clockType === 'analog') {
				this.drawAnalogClock();
			}

			console.log('Manual refresh completed successfully');
		} catch (error) {
			console.error('Error during manual refresh:', error);
		} finally {
			// Restore button state
			if (this.dom.refreshData) {
				this.dom.refreshData.disabled = false;
				this.dom.refreshData.textContent = this.getText('refresh');
			}
		}
	}

	// Convert Western numerals to Arabic-Indic numerals
	toArabicNumerals(num) {
		const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
		return num.toString().replace(/\d/g, digit => arabicNumerals[parseInt(digit)]);
	}

	// Apply prayer time offsets and daylight saving adjustment
	applyTimeAdjustments(prayerTimes) {
		const adjustedTimes = { ...prayerTimes };

		// Apply prayer-specific offsets
		Object.keys(this.state.prayerOffsets).forEach(prayer => {
			if (adjustedTimes[prayer]) {
				const offset = this.state.prayerOffsets[prayer];
				if (offset !== 0) {
					adjustedTimes[prayer] = this.adjustTimeByMinutes(adjustedTimes[prayer], offset);
				}
			}
		});

		// Apply daylight saving adjustment to all prayer times
		if (this.state.daylightSaving !== 0) {
			const dstMinutes = this.state.daylightSaving * 60; // -60, 0, or +60 minutes
			Object.keys(adjustedTimes).forEach(prayer => {
				if (adjustedTimes[prayer] && adjustedTimes[prayer].includes(':')) {
					adjustedTimes[prayer] = this.adjustTimeByMinutes(adjustedTimes[prayer], dstMinutes);
				}
			});
		}

		return adjustedTimes;
	}

	// Adjust time string by adding/subtracting minutes
	adjustTimeByMinutes(timeString, minutes) {
		try {
			const [hours, mins] = timeString.split(':').map(Number);
			let totalMinutes = hours * 60 + mins + minutes;

			// Handle day overflow/underflow
			if (totalMinutes < 0) {
				totalMinutes += 24 * 60;
			} else if (totalMinutes >= 24 * 60) {
				totalMinutes -= 24 * 60;
			}

			const newHours = Math.floor(totalMinutes / 60);
			const newMins = totalMinutes % 60;

			return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
		} catch (error) {
			console.error('Error adjusting time:', error);
			return timeString; // Return original if error
		}
	}

	updateHijriDate() {
		if (!this.dom.hijriDate) {
			console.error('Hijri date DOM element not found!');
			return;
		}

		if (this.state.hijriDate &&
			this.state.hijriDate.day &&
			(this.state.hijriDate.monthAr || this.state.hijriDate.month) &&
			this.state.hijriDate.year) {

			let monthName, weekdayName, day, year, hijriText;

			if (this.state.language === 'ar') {
				// Arabic format
				monthName = this.state.hijriDate.monthAr || this.state.hijriDate.month;
				weekdayName = this.state.hijriDate.weekdayAr || this.state.hijriDate.weekday || '';
				day = this.toArabicNumerals(this.state.hijriDate.day);
				year = this.toArabicNumerals(this.state.hijriDate.year);

				// Format: "الاثنين ١٢ محرم ١٤٤٧ هـ"
				hijriText = weekdayName
					? `🌙 ${weekdayName} ${day} ${monthName} ${year} هـ`
					: `🌙 ${day} ${monthName} ${year} هـ`;
			} else {
				// English format
				monthName = this.state.hijriDate.month;
				weekdayName = this.state.hijriDate.weekday || '';
				day = this.state.hijriDate.day;
				year = this.state.hijriDate.year;

				// Format: "Monday 12 Muharram 1447 AH"
				hijriText = weekdayName
					? `🌙 ${weekdayName} ${day} ${monthName} ${year} AH`
					: `🌙 ${day} ${monthName} ${year} AH`;
			}

			this.dom.hijriDate.textContent = hijriText;
		} else {
			console.log('Hijri date incomplete or missing, not updating display');
		}
	}

	getAnyHijriCache() {
		try {
			const keys = Object.keys(localStorage);
			const hijriKeys = keys.filter(key => key.startsWith('hijri-date-'));

			for (const key of hijriKeys) {
				const cached = this.getFromCache(key);
				if (cached && cached.day && (cached.monthAr || cached.month) && cached.year) {
					console.log('Using fallback Hijri cache from:', key);
					return cached;
				}
			}
		} catch (error) {
			console.error('Error searching for Hijri cache:', error);
		}
		return null;
	}

	// Utility functions
	debounce(func, delay) {
		let timeoutId;
		return function (...args) {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => func.apply(this, args), delay);
		};
	}

	getFromCache(key) {
		try {
			const cached = localStorage.getItem(key);
			if (cached) {
				const { data, timestamp } = JSON.parse(cached);
				// Check if cache is still valid (within 24 hours)
				if (Date.now() - timestamp < this.config.cacheTimeout) {
					console.log('Using cached data for:', key);
					return data;
				} else {
					// Keep expired cache for fallback, but mark it as expired
					console.log('Cache expired but keeping for fallback:', key);
					// Don't remove expired cache immediately - keep as fallback
				}
			}
		} catch (error) {
			console.error('Cache read error for', key, ':', error);
			// Don't remove cache on read error - might be temporary
		}

		// Try to get any existing cache as fallback, even if expired
		try {
			const cached = localStorage.getItem(key);
			if (cached) {
				const { data } = JSON.parse(cached);
				if (data && Object.keys(data).length > 0) {
					console.log('Using expired cache as fallback for:', key);
					return data;
				}
			}
		} catch (error) {
			console.error('Fallback cache read error for', key, ':', error);
		}

		return null;
	}

	setCache(key, data) {
		try {
			const cacheData = {
				data,
				timestamp: Date.now()
			};
			localStorage.setItem(key, JSON.stringify(cacheData));
			console.log('Data cached with key:', key);
		} catch (error) {
			console.error('Cache write error:', error);
			// If localStorage is full, try to clear old prayer time caches
			this.clearOldCaches();
		}
	}

	clearPrayerTimesCache() {
		try {
			if (!this.state.location) return;

			const keys = Object.keys(localStorage);
			const locationPrefix = `prayer-times-${this.state.location.lat}-${this.state.location.lng}`;
			const prayerTimeKeys = keys.filter(key => key.startsWith(locationPrefix));

			prayerTimeKeys.forEach(key => {
				localStorage.removeItem(key);
				console.log('Cleared prayer cache:', key);
			});

			console.log(`Cleared ${prayerTimeKeys.length} prayer time cache entries for current location`);
		} catch (error) {
			console.error('Error clearing prayer times cache:', error);
		}
	}

	clearOldCaches() {
		try {
			const keys = Object.keys(localStorage);
			const prayerTimeKeys = keys.filter(key => key.startsWith('prayer-times-'));

			// Only remove caches older than 30 days (keep more data for fallback)
			const monthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

			prayerTimeKeys.forEach(key => {
				try {
					const cached = JSON.parse(localStorage.getItem(key));
					if (cached.timestamp < monthAgo) {
						localStorage.removeItem(key);
						console.log('Removed very old cache:', key);
					}
				} catch (e) {
					// Only remove if completely corrupted
					try {
						JSON.parse(localStorage.getItem(key));
					} catch (parseError) {
						localStorage.removeItem(key);
						console.log('Removed corrupted cache:', key);
					}
				}
			});
		} catch (error) {
			console.error('Error clearing old caches:', error);
		}
	}
}

// Initialize the clock when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
	new IslamicPrayerClock();
});
