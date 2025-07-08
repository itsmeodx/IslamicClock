# Islamic Prayer Clock

A modern, responsive Islamic prayer clock application that displays both digital and analog views with prayer times, Hijri date, and customizable settings.

## Project Structure

```
IslamicClock/
├── index.html              # Main HTML file with clean structure
├── css/
│   └── styles.css          # Complete CSS styling for the application
├── js/
│   └── main.js             # Complete JavaScript application logic
├── simple-clock.html       # Original monolithic file (for reference)
└── README.md               # This file
```

## Features

- **Dual Display Modes**: Switch between digital and analog clock views
- **Prayer Times**: Accurate prayer times based on your location
- **Hijri Calendar**: Display current Hijri date
- **Multilingual**: Full support for English and Arabic
- **Customizable Settings**:
  - Calculation methods for prayer times
  - Daylight saving time adjustment
  - Per-prayer time offsets
  - Progress display toggle
- **Responsive Design**: Works on desktop and mobile devices
- **Offline Support**: Caches data for offline use

## Architecture

### Clean Separation of Concerns
The application has been refactored from a single monolithic file into a clean, maintainable structure:

- **HTML (`index.html`)**: Clean semantic markup with external resource references
- **CSS (`css/styles.css`)**: Complete styling including Islamic themes, responsive design, and settings UI
- **JavaScript (`js/main.js`)**: Full application logic in a single `IslamicPrayerClock` class

### Key Components in main.js
1. **Configuration Management**: API endpoints, timeouts, and default settings
2. **State Management**: Clock type, language, prayer times, and user preferences
3. **DOM Management**: Cached element references and event handling
4. **Prayer Time Calculations**: API integration with caching and offline support
5. **Hijri Calendar**: Islamic date conversion and display
6. **Multi-language Support**: Complete English/Arabic translation system
7. **Canvas Rendering**: Beautiful analog clock with Islamic geometric patterns
8. **Settings Management**: Persistent user preferences and real-time updates

### Key Benefits
1. **Maintainability**: Clear separation between presentation, styling, and logic
2. **Performance**: Optimized canvas rendering with caching and smart redraws
3. **Reliability**: Robust error handling and offline fallback mechanisms
4. **Accessibility**: Multi-language support with proper RTL text handling

## Usage

Simply open `index.html` in a web browser. The application will:

1. Request location permission for accurate prayer times
2. Fetch prayer times from the Aladhan API
3. Display the clock in your preferred language and format
4. Cache data for offline use

### File Structure
- **`index.html`**: Main entry point with clean HTML structure
- **`css/styles.css`**: All styling including Islamic themes and responsive design
- **`js/main.js`**: Complete application logic with IslamicPrayerClock class
- **`simple-clock.html`**: Original single-file version (kept for reference)

## Configuration

Prayer time calculation methods and other settings can be customized through the settings panel (gear icon in the top-left corner).

## Browser Support

- Modern browsers with ES6+ support
- Canvas API support required for analog clock
- Geolocation API optional (falls back to Mecca coordinates)

## API Dependencies

- [Aladhan API](https://aladhan.com/prayer-times-api) for prayer times and Hijri dates
- [BigDataCloud API](https://bigdatacloud.net) for reverse geocoding (location names)
