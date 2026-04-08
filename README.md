<div align="center">
  <h1>Islamic Clock</h1>

**A high-precision analog prayer dial for Chrome and Firefox.**

[Web App](https://itsmeodx.github.io/IslamicClock/) • [Browser Extensions](#installation) • [Releases](https://github.com/itsmeodx/IslamicClock/releases)

</div>

---

The Islamic Prayer Clock is a continuous astronomical dial that visualizes the passage of time according to the sun's orbital track. Unlike standard clocks, it maps the specific astronomical markers of prayer (Fajr, Dhuhr, Asr, Maghrib, Isha) onto a single cyclical path.

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Installation](#installation)
  - [Browser Extension](#browser-extension)
- [Key Features](#key-features)
- [Building from Source](#building-from-source)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Build Commands](#build-commands)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

## Installation

### Browser Extension

Installs as your browser's "New Tab" page.

<p align="center">
  <a href="https://github.com/itsmeodx/IslamicClock/releases/download/latest/chrome.zip">
    <img src="https://lh4.ggpht.com/x-plP9YZXhCaiDkTKQ5S29PwLmdi4feEKrMOtQle4NuoOaUgKUMH9pPWIg91da3anhSmw-G8erEIuU0d" width="140" alt="Google Chrome" title="Download for Google Chrome">
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://github.com/itsmeodx/IslamicClock/releases/download/latest/firefox.xpi">
    <img src="https://www.mozilla.org/media/img/structured-data/logo-firefox-browser.fbc7ffbb50fd.png" width="140" alt="Mozilla Firefox" title="Download for Mozilla Firefox">
  </a>
</p>

- **Chrome / Edge / Brave**: Click the icon above to **Download the ZIP**, then extract it and select **"Load unpacked"** in `chrome://extensions`.
- **Firefox**: Click the icon above for **Instant Installation**, or go to [releases](https://github.com/itsmeodx/IslamicClock/releases), download the XPI file and drag it into any open Firefox window.

## Key Features

- **Native Extension Support**: Dedicated optimized builds for Chrome, Edge, Brave, and Firefox.
- **Mobile Ready (PWA)**: Installable Progressive Web App with full offline support.

## Building from Source

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or higher)
- [pnpm](https://pnpm.io/) (v9 or higher)

### Setup

```bash
# Clone the repository
git clone https://github.com/itsmeodx/IslamicClock.git
cd IslamicClock

# Install dependencies
pnpm install

# Start local development
pnpm run dev
```

### Build Commands

| Command                | Result                                                     |
| :--------------------- | :--------------------------------------------------------- |
| `pnpm build`           | Generates production web bundle in `dist/`                 |
| `pnpm build:extension` | Packages extension artifacts (`chrome.zip`, `firefox.xpi`) |

## Contributing

Contributions are welcome! If you have suggestions for improvements or encounter bugs, please open an [issue](https://github.com/itsmeodx/IslamicClock/issues) or submit a pull request.

## Support

If you find this project useful, consider giving it a ⭐ on GitHub to show your support!

## License

Distributed under the GNU GPL v3 License. See `LICENSE` for more information.
