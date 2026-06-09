# Configuration

All user settings live in one object, persisted to `localStorage["heritage-settings"]`
and edited through the [SettingsPanel](../src/components/SettingsPanel.jsx). The
defaults are defined in [ClockContext.jsx](../src/context/ClockContext.jsx):

```js
{
  language: "ar",          // "ar" | "en"
  calculationMethod: 21,   // Aladhan method id (21 = Morocco)
  dstOffset: 0,            // hours: -1 | 0 | +1
  hijriOffset: 0,          // days:  -2 … +2
  prayerOffsets: {         // minutes per prayer, -60 … +60
    Fajr: 0, Sunrise: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0,
  },
  clockMode: "analog",     // "analog" | "digital"
}
```

## Settings reference

| Setting             | Values                        | Effect                                                                                                                                                   |
| :------------------ | :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `language`          | `ar`, `en`                    | Selects the [translations](../src/utils/translations.js) bundle, sets page `dir` (RTL for Arabic), and switches numerals to Arabic-Indic in Arabic mode. |
| `clockMode`         | `analog`, `digital`           | Chooses the [dial](./prayer-dial.md) or the [digital display](../src/components/DigitalClock.jsx).                                                       |
| `calculationMethod` | Aladhan method id             | Which authority's angles are used to compute prayer times (see below).                                                                                   |
| `dstOffset`         | `-1`, `0`, `+1`               | Hour shift applied to **all** fetched times, for when the API's DST handling disagrees with local clocks.                                                |
| `hijriOffset`       | `-2` … `+2`                   | Day shift on the Hijri date, for moon-sighting differences between regions.                                                                              |
| `prayerOffsets`     | `-60` … `+60` min, per prayer | Fine-tunes each prayer's time. Sent to Aladhan as the `tune` parameter.                                                                                  |

## How offsets are applied

The three offset types are applied at different stages:

- **`prayerOffsets`** are pushed _up to the API_. They are assembled into
  Aladhan's `tune` parameter in [usePrayerTimes.js](../src/hooks/usePrayerTimes.js)
  in this fixed order:

  ```text
  tune = Imsak,Fajr,Sunrise,Dhuhr,Asr,Maghrib,Sunset,Isha,Midnight
       =   0  ,Fajr,Sunrise,Dhuhr,Asr,Maghrib,  0   ,Isha,  0
  ```

  Only the six configurable prayers carry values; the rest are `0`. Because the
  `tune` string is part of the query key, changing an offset transparently fetches
  a freshly-tuned month.

- **`dstOffset`** is applied _after_ fetching, while sanitizing each time string:
  `h = (h + dstOffset + 24) % 24`. It does not change the API request.

- **`hijriOffset`** is applied _after_ fetching to the Hijri day number only
  (`adjustHijriDate`), zero-padded back to two digits.

## Calculation methods

The method id is the Aladhan `method` query parameter. The human-readable labels
are defined per language in [translations.js](../src/utils/translations.js)
(`calculationMethods`). The ids the UI exposes, with the English labels as shipped:

|  id | Method                                        |
| --: | :-------------------------------------------- |
|   0 | Shia Ithna-Ashari, Leva Institute, Qum        |
|   1 | University of Islamic Sciences, Karachi       |
|   2 | Islamic Society of North America (ISNA)       |
|   3 | Muslim World League                           |
|   4 | Umm Al-Qura University, Makkah                |
|   5 | Egyptian General Authority of Survey          |
|   7 | Institute of Geophysics, University of Tehran |
|   8 | Gulf Region                                   |
|   9 | Kuwait                                        |
|  10 | Qatar                                         |
|  11 | Majlis Ugama Islam Singapura, Singapore       |
|  12 | Union Organization Islamic de France          |
|  13 | Diyanet İşleri Başkanlığı, Turkey             |
|  14 | Spiritual Administration of Muslims of Russia |
|  15 | Moonsighting Committee Worldwide              |
|  16 | Dubai (experimental)                          |
|  17 | Jabatan Kemajuan Islam Malaysia (JAKIM)       |
|  18 | Tunisia                                       |
|  19 | Algeria                                       |
|  20 | Kementerian Agama Republik Indonesia          |
|  21 | **Morocco** (default)                         |
|  22 | Comunidade Islamica de Lisboa                 |
|  23 | Ministry of Awqaf, Jordan                     |

> Method id `6` is not exposed in the UI. The canonical, always-current list of
> method ids is maintained by Aladhan; this table reflects the labels in
> `translations.js`. If Aladhan adds or renumbers methods, update that file.

## Resetting

- **Reset location** (`resetLocation`) clears `last-known-location` and returns to
  the location-request screen, keeping other settings.
- **Reset** (`resetSettings`) clears **all** `localStorage` and reloads, restoring
  every default above.
