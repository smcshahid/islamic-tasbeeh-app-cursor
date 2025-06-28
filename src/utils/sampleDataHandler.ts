/**
 * Sample Data Handler
 * Handles the sample prayer times data format for development/testing
 */

import { DayPrayerTimes, PrayerTime, PrayerName } from '../types';

// Sample data type from the API
interface SampleApiTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
  Firstthird: string;
  Lastthird: string;
}

interface SampleApiData {
  timings: SampleApiTimings;
  date: {
    readable: string;
    timestamp: string;
    gregorian: {
      date: string; // DD-MM-YYYY format
      format: string;
      day: string;
      weekday: { en: string };
      month: { number: number; en: string };
      year: string;
      designation: { abbreviated: string; expanded: string };
      lunarSighting: boolean;
    };
    hijri: {
      date: string; // DD-MM-YYYY format
      format: string;
      day: string;
      weekday: { en: string; ar: string };
      month: { 
        number: number; 
        en: string; 
        ar: string; 
        days: number; 
      };
      year: string;
      designation: { abbreviated: string; expanded: string };
      holidays: string[];
      adjustedHolidays: string[];
      method: string;
    };
  };
  meta: {
    latitude: number;
    longitude: number;
    timezone: string;
    method: {
      id: number;
      name: string;
      params: { Fajr: number; Isha: number };
      location: { latitude: number; longitude: number };
    };
    latitudeAdjustmentMethod: string;
    midnightMode: string;
    school: string;
    offset: {
      Imsak: string;
      Fajr: string;
      Sunrise: string;
      Dhuhr: string;
      Asr: string;
      Maghrib: string;
      Sunset: number;
      Isha: string;
      Midnight: string;
    };
  };
}

interface SampleApiResponse {
  code: number;
  status: string;
  data: SampleApiData[];
}

/**
 * Convert sample API data to app format
 */
export function convertSampleDataToAppFormat(apiData: SampleApiData): DayPrayerTimes {
  // Convert DD-MM-YYYY to YYYY-MM-DD format
  const [day, month, year] = apiData.date.gregorian.date.split('-');
  const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

  // Convert Hijri date format
  const [hijriDay, hijriMonth, hijriYear] = apiData.date.hijri.date.split('-');
  const hijriDateString = `${hijriDay} ${apiData.date.hijri.month.en} ${hijriYear} AH`;

  // Extract prayer times and convert from UTC to local times
  const extractTime = (timeString: string): string => {
    // Remove (UTC) suffix and return HH:MM format
    const time = timeString.replace(' (UTC)', '');
    return time;
  };

  const prayers: PrayerTime[] = [
    {
      name: 'fajr' as PrayerName,
      time: extractTime(apiData.timings.Fajr),
      originalTime: extractTime(apiData.timings.Fajr),
      adjustment: 0,
      notificationEnabled: true,
      isNotified: false,
    },
    {
      name: 'dhuhr' as PrayerName,
      time: extractTime(apiData.timings.Dhuhr),
      originalTime: extractTime(apiData.timings.Dhuhr),
      adjustment: 0,
      notificationEnabled: true,
      isNotified: false,
    },
    {
      name: 'asr' as PrayerName,
      time: extractTime(apiData.timings.Asr),
      originalTime: extractTime(apiData.timings.Asr),
      adjustment: 0,
      notificationEnabled: true,
      isNotified: false,
    },
    {
      name: 'maghrib' as PrayerName,
      time: extractTime(apiData.timings.Maghrib),
      originalTime: extractTime(apiData.timings.Maghrib),
      adjustment: 0,
      notificationEnabled: true,
      isNotified: false,
    },
    {
      name: 'isha' as PrayerName,
      time: extractTime(apiData.timings.Isha),
      originalTime: extractTime(apiData.timings.Isha),
      adjustment: 0,
      notificationEnabled: true,
      isNotified: false,
    },
  ];

  return {
    date: formattedDate,
    hijriDate: hijriDateString,
    prayers,
    location: {
      city: 'London', // Default from the sample data location
      country: 'UK',
      latitude: apiData.meta.latitude,
      longitude: apiData.meta.longitude,
    },
    method: {
      id: apiData.meta.method.id,
      name: apiData.meta.method.name,
      description: `Calculation method used for ${apiData.meta.method.name}`,
    },
  };
}

/**
 * Find prayer times for a specific date from sample data
 */
export function findPrayerTimesForDate(
  sampleResponse: SampleApiResponse, 
  targetDate: string
): DayPrayerTimes | null {
  // Convert YYYY-MM-DD to DD-MM-YYYY for comparison
  const [year, month, day] = targetDate.split('-');
  const gregorianDate = `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;

  const matchingData = sampleResponse.data.find(
    item => item.date.gregorian.date === gregorianDate
  );

  if (!matchingData) {
    return null;
  }

  return convertSampleDataToAppFormat(matchingData);
}

/**
 * Sample data for development (the complete data provided by the user)
 */
export const SAMPLE_PRAYER_DATA: SampleApiResponse = {
  "code": 200,
  "status": "OK",
  "data": [
    {
      "timings": {
        "Fajr": "01:34 (UTC)",
        "Sunrise": "03:54 (UTC)",
        "Dhuhr": "12:05 (UTC)",
        "Asr": "16:27 (UTC)",
        "Sunset": "20:09 (UTC)",
        "Maghrib": "20:08 (UTC)",
        "Isha": "22:27 (UTC)",
        "Imsak": "01:26 (UTC)",
        "Midnight": "23:53 (UTC)",
        "Firstthird": "22:42 (UTC)",
        "Lastthird": "01:15 (UTC)"
      },
      "date": {
        "readable": "01 Jun 2025",
        "timestamp": "1748768461",
        "gregorian": {
          "date": "01-06-2025",
          "format": "DD-MM-YYYY",
          "day": "01",
          "weekday": {
            "en": "Sunday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "05-12-1446",
          "format": "DD-MM-YYYY",
          "day": "5",
          "weekday": {
            "en": "Al Ahad",
            "ar": "الاحد"
          },
          "month": {
            "number": 12,
            "en": "Dhū al-Ḥijjah",
            "ar": "ذوالحجة",
            "days": 29
          },
          "year": "1446",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    },
    {
      "timings": {
        "Fajr": "01:34 (UTC)",
        "Sunrise": "03:53 (UTC)",
        "Dhuhr": "12:06 (UTC)",
        "Asr": "16:27 (UTC)",
        "Sunset": "20:10 (UTC)",
        "Maghrib": "20:09 (UTC)",
        "Isha": "22:27 (UTC)",
        "Imsak": "01:26 (UTC)",
        "Midnight": "23:53 (UTC)",
        "Firstthird": "22:42 (UTC)",
        "Lastthird": "01:15 (UTC)"
      },
      "date": {
        "readable": "02 Jun 2025",
        "timestamp": "1748854861",
        "gregorian": {
          "date": "02-06-2025",
          "format": "DD-MM-YYYY",
          "day": "02",
          "weekday": {
            "en": "Monday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "06-12-1446",
          "format": "DD-MM-YYYY",
          "day": "6",
          "weekday": {
            "en": "Al Athnayn",
            "ar": "الاثنين"
          },
          "month": {
            "number": 12,
            "en": "Dhū al-Ḥijjah",
            "ar": "ذوالحجة",
            "days": 29
          },
          "year": "1446",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    },
    {
      "timings": {
        "Fajr": "01:33 (UTC)",
        "Sunrise": "03:52 (UTC)",
        "Dhuhr": "12:06 (UTC)",
        "Asr": "16:28 (UTC)",
        "Sunset": "20:11 (UTC)",
        "Maghrib": "20:10 (UTC)",
        "Isha": "22:28 (UTC)",
        "Imsak": "01:25 (UTC)",
        "Midnight": "23:53 (UTC)",
        "Firstthird": "22:43 (UTC)",
        "Lastthird": "01:15 (UTC)"
      },
      "date": {
        "readable": "03 Jun 2025",
        "timestamp": "1748941261",
        "gregorian": {
          "date": "03-06-2025",
          "format": "DD-MM-YYYY",
          "day": "03",
          "weekday": {
            "en": "Tuesday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "07-12-1446",
          "format": "DD-MM-YYYY",
          "day": "7",
          "weekday": {
            "en": "Al Thalaata",
            "ar": "الثلاثاء"
          },
          "month": {
            "number": 12,
            "en": "Dhū al-Ḥijjah",
            "ar": "ذوالحجة",
            "days": 29
          },
          "year": "1446",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    },
    {
      "timings": {
        "Fajr": "01:33 (UTC)",
        "Sunrise": "03:52 (UTC)",
        "Dhuhr": "12:06 (UTC)",
        "Asr": "16:28 (UTC)",
        "Sunset": "20:12 (UTC)",
        "Maghrib": "20:11 (UTC)",
        "Isha": "22:29 (UTC)",
        "Imsak": "01:25 (UTC)",
        "Midnight": "23:53 (UTC)",
        "Firstthird": "22:43 (UTC)",
        "Lastthird": "01:15 (UTC)"
      },
      "date": {
        "readable": "04 Jun 2025",
        "timestamp": "1749027661",
        "gregorian": {
          "date": "04-06-2025",
          "format": "DD-MM-YYYY",
          "day": "04",
          "weekday": {
            "en": "Wednesday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "08-12-1446",
          "format": "DD-MM-YYYY",
          "day": "8",
          "weekday": {
            "en": "Al Arba'a",
            "ar": "الاربعاء"
          },
          "month": {
            "number": 12,
            "en": "Dhū al-Ḥijjah",
            "ar": "ذوالحجة",
            "days": 29
          },
          "year": "1446",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [
            "Hajj"
          ],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    },
    {
      "timings": {
        "Fajr": "01:33 (UTC)",
        "Sunrise": "03:51 (UTC)",
        "Dhuhr": "12:06 (UTC)",
        "Asr": "16:29 (UTC)",
        "Sunset": "20:13 (UTC)",
        "Maghrib": "20:12 (UTC)",
        "Isha": "22:29 (UTC)",
        "Imsak": "01:25 (UTC)",
        "Midnight": "23:53 (UTC)",
        "Firstthird": "22:44 (UTC)",
        "Lastthird": "01:15 (UTC)"
      },
      "date": {
        "readable": "05 Jun 2025",
        "timestamp": "1749114061",
        "gregorian": {
          "date": "05-06-2025",
          "format": "DD-MM-YYYY",
          "day": "05",
          "weekday": {
            "en": "Thursday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "09-12-1446",
          "format": "DD-MM-YYYY",
          "day": "9",
          "weekday": {
            "en": "Al Khamees",
            "ar": "الخميس"
          },
          "month": {
            "number": 12,
            "en": "Dhū al-Ḥijjah",
            "ar": "ذوالحجة",
            "days": 29
          },
          "year": "1446",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [
            "Hajj",
            "Arafa"
          ],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    },
    {
      "timings": {
        "Fajr": "01:33 (UTC)",
        "Sunrise": "03:51 (UTC)",
        "Dhuhr": "12:06 (UTC)",
        "Asr": "16:29 (UTC)",
        "Sunset": "20:13 (UTC)",
        "Maghrib": "20:12 (UTC)",
        "Isha": "22:30 (UTC)",
        "Imsak": "01:25 (UTC)",
        "Midnight": "23:53 (UTC)",
        "Firstthird": "22:44 (UTC)",
        "Lastthird": "01:15 (UTC)"
      },
      "date": {
        "readable": "06 Jun 2025",
        "timestamp": "1749200461",
        "gregorian": {
          "date": "06-06-2025",
          "format": "DD-MM-YYYY",
          "day": "06",
          "weekday": {
            "en": "Friday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "10-12-1446",
          "format": "DD-MM-YYYY",
          "day": "10",
          "weekday": {
            "en": "Al Juma'a",
            "ar": "الجمعة"
          },
          "month": {
            "number": 12,
            "en": "Dhū al-Ḥijjah",
            "ar": "ذوالحجة",
            "days": 29
          },
          "year": "1446",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [
            "Eid-ul-Adha",
            "Hajj"
          ],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    },
    {
      "timings": {
        "Fajr": "01:33 (UTC)",
        "Sunrise": "03:50 (UTC)",
        "Dhuhr": "12:06 (UTC)",
        "Asr": "16:30 (UTC)",
        "Sunset": "20:14 (UTC)",
        "Maghrib": "20:13 (UTC)",
        "Isha": "22:30 (UTC)",
        "Imsak": "01:25 (UTC)",
        "Midnight": "23:54 (UTC)",
        "Firstthird": "22:45 (UTC)",
        "Lastthird": "01:15 (UTC)"
      },
      "date": {
        "readable": "07 Jun 2025",
        "timestamp": "1749286861",
        "gregorian": {
          "date": "07-06-2025",
          "format": "DD-MM-YYYY",
          "day": "07",
          "weekday": {
            "en": "Saturday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "11-12-1446",
          "format": "DD-MM-YYYY",
          "day": "11",
          "weekday": {
            "en": "Al Sabt",
            "ar": "السبت"
          },
          "month": {
            "number": 12,
            "en": "Dhū al-Ḥijjah",
            "ar": "ذوالحجة",
            "days": 29
          },
          "year": "1446",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [
            "Hajj"
          ],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    },
    {
      "timings": {
        "Fajr": "01:33 (UTC)",
        "Sunrise": "03:50 (UTC)",
        "Dhuhr": "12:07 (UTC)",
        "Asr": "16:30 (UTC)",
        "Sunset": "20:15 (UTC)",
        "Maghrib": "20:14 (UTC)",
        "Isha": "22:30 (UTC)",
        "Imsak": "01:25 (UTC)",
        "Midnight": "23:54 (UTC)",
        "Firstthird": "22:45 (UTC)",
        "Lastthird": "01:15 (UTC)"
      },
      "date": {
        "readable": "08 Jun 2025",
        "timestamp": "1749373261",
        "gregorian": {
          "date": "08-06-2025",
          "format": "DD-MM-YYYY",
          "day": "08",
          "weekday": {
            "en": "Sunday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "12-12-1446",
          "format": "DD-MM-YYYY",
          "day": "12",
          "weekday": {
            "en": "Al Ahad",
            "ar": "الاحد"
          },
          "month": {
            "number": 12,
            "en": "Dhū al-Ḥijjah",
            "ar": "ذوالحجة",
            "days": 29
          },
          "year": "1446",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [
            "Hajj"
          ],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    },
    {
      "timings": {
        "Fajr": "01:33 (UTC)",
        "Sunrise": "03:49 (UTC)",
        "Dhuhr": "12:07 (UTC)",
        "Asr": "16:30 (UTC)",
        "Sunset": "20:16 (UTC)",
        "Maghrib": "20:15 (UTC)",
        "Isha": "22:31 (UTC)",
        "Imsak": "01:25 (UTC)",
        "Midnight": "23:54 (UTC)",
        "Firstthird": "22:45 (UTC)",
        "Lastthird": "01:15 (UTC)"
      },
      "date": {
        "readable": "09 Jun 2025",
        "timestamp": "1749459661",
        "gregorian": {
          "date": "09-06-2025",
          "format": "DD-MM-YYYY",
          "day": "09",
          "weekday": {
            "en": "Monday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "13-12-1446",
          "format": "DD-MM-YYYY",
          "day": "13",
          "weekday": {
            "en": "Al Athnayn",
            "ar": "الاثنين"
          },
          "month": {
            "number": 12,
            "en": "Dhū al-Ḥijjah",
            "ar": "ذوالحجة",
            "days": 29
          },
          "year": "1446",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [
            "Hajj"
          ],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    },
    {
      "timings": {
        "Fajr": "01:33 (UTC)",
        "Sunrise": "03:49 (UTC)",
        "Dhuhr": "12:07 (UTC)",
        "Asr": "16:31 (UTC)",
        "Sunset": "20:17 (UTC)",
        "Maghrib": "20:16 (UTC)",
        "Isha": "22:31 (UTC)",
        "Imsak": "01:25 (UTC)",
        "Midnight": "23:54 (UTC)",
        "Firstthird": "22:46 (UTC)",
        "Lastthird": "01:15 (UTC)"
      },
      "date": {
        "readable": "10 Jun 2025",
        "timestamp": "1749546061",
        "gregorian": {
          "date": "10-06-2025",
          "format": "DD-MM-YYYY",
          "day": "10",
          "weekday": {
            "en": "Tuesday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "14-12-1446",
          "format": "DD-MM-YYYY",
          "day": "14",
          "weekday": {
            "en": "Al Thalaata",
            "ar": "الثلاثاء"
          },
          "month": {
            "number": 12,
            "en": "Dhū al-Ḥijjah",
            "ar": "ذوالحجة",
            "days": 29
          },
          "year": "1446",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    },
    {
      "timings": {
        "Fajr": "01:33 (UTC)",
        "Sunrise": "03:48 (UTC)",
        "Dhuhr": "12:07 (UTC)",
        "Asr": "16:31 (UTC)",
        "Sunset": "20:17 (UTC)",
        "Maghrib": "20:16 (UTC)",
        "Isha": "22:32 (UTC)",
        "Imsak": "01:25 (UTC)",
        "Midnight": "23:54 (UTC)",
        "Firstthird": "22:46 (UTC)",
        "Lastthird": "01:15 (UTC)"
      },
      "date": {
        "readable": "11 Jun 2025",
        "timestamp": "1749632461",
        "gregorian": {
          "date": "11-06-2025",
          "format": "DD-MM-YYYY",
          "day": "11",
          "weekday": {
            "en": "Wednesday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "15-12-1446",
          "format": "DD-MM-YYYY",
          "day": "15",
          "weekday": {
            "en": "Al Arba'a",
            "ar": "الاربعاء"
          },
          "month": {
            "number": 12,
            "en": "Dhū al-Ḥijjah",
            "ar": "ذوالحجة",
            "days": 29
          },
          "year": "1446",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    },
    {
      "timings": {
        "Fajr": "01:33 (UTC)",
        "Sunrise": "03:48 (UTC)",
        "Dhuhr": "12:07 (UTC)",
        "Asr": "16:32 (UTC)",
        "Sunset": "20:18 (UTC)",
        "Maghrib": "20:17 (UTC)",
        "Isha": "22:32 (UTC)",
        "Imsak": "01:25 (UTC)",
        "Midnight": "23:55 (UTC)",
        "Firstthird": "22:46 (UTC)",
        "Lastthird": "01:15 (UTC)"
      },
      "date": {
        "readable": "12 Jun 2025",
        "timestamp": "1749718861",
        "gregorian": {
          "date": "12-06-2025",
          "format": "DD-MM-YYYY",
          "day": "12",
          "weekday": {
            "en": "Thursday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "16-12-1446",
          "format": "DD-MM-YYYY",
          "day": "16",
          "weekday": {
            "en": "Al Khamees",
            "ar": "الخميس"
          },
          "month": {
            "number": 12,
            "en": "Dhū al-Ḥijjah",
            "ar": "ذوالحجة",
            "days": 29
          },
          "year": "1446",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    },
    {
      "timings": {
        "Fajr": "01:33 (UTC)",
        "Sunrise": "03:48 (UTC)",
        "Dhuhr": "12:08 (UTC)",
        "Asr": "16:32 (UTC)",
        "Sunset": "20:19 (UTC)",
        "Maghrib": "20:18 (UTC)",
        "Isha": "22:33 (UTC)",
        "Imsak": "01:25 (UTC)",
        "Midnight": "23:55 (UTC)",
        "Firstthird": "22:47 (UTC)",
        "Lastthird": "01:15 (UTC)"
      },
      "date": {
        "readable": "13 Jun 2025",
        "timestamp": "1749805261",
        "gregorian": {
          "date": "13-06-2025",
          "format": "DD-MM-YYYY",
          "day": "13",
          "weekday": {
            "en": "Friday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "17-12-1446",
          "format": "DD-MM-YYYY",
          "day": "17",
          "weekday": {
            "en": "Al Juma'a",
            "ar": "الجمعة"
          },
          "month": {
            "number": 12,
            "en": "Dhū al-Ḥijjah",
            "ar": "ذوالحجة",
            "days": 29
          },
          "year": "1446",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    },
    {
      "timings": {
        "Fajr": "01:33 (UTC)",
        "Sunrise": "03:48 (UTC)",
        "Dhuhr": "12:08 (UTC)",
        "Asr": "16:32 (UTC)",
        "Sunset": "20:19 (UTC)",
        "Maghrib": "20:18 (UTC)",
        "Isha": "22:33 (UTC)",
        "Imsak": "01:25 (UTC)",
        "Midnight": "23:55 (UTC)",
        "Firstthird": "22:47 (UTC)",
        "Lastthird": "01:15 (UTC)"
      },
      "date": {
        "readable": "14 Jun 2025",
        "timestamp": "1749891661",
        "gregorian": {
          "date": "14-06-2025",
          "format": "DD-MM-YYYY",
          "day": "14",
          "weekday": {
            "en": "Saturday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "18-12-1446",
          "format": "DD-MM-YYYY",
          "day": "18",
          "weekday": {
            "en": "Al Sabt",
            "ar": "السبت"
          },
          "month": {
            "number": 12,
            "en": "Dhū al-Ḥijjah",
            "ar": "ذوالحجة",
            "days": 29
          },
          "year": "1446",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    },
    {
      "timings": {
        "Fajr": "01:33 (UTC)",
        "Sunrise": "03:48 (UTC)",
        "Dhuhr": "12:08 (UTC)",
        "Asr": "16:33 (UTC)",
        "Sunset": "20:20 (UTC)",
        "Maghrib": "20:19 (UTC)",
        "Isha": "22:33 (UTC)",
        "Imsak": "01:25 (UTC)",
        "Midnight": "23:55 (UTC)",
        "Firstthird": "22:47 (UTC)",
        "Lastthird": "01:15 (UTC)"
      },
      "date": {
        "readable": "15 Jun 2025",
        "timestamp": "1749978061",
        "gregorian": {
          "date": "15-06-2025",
          "format": "DD-MM-YYYY",
          "day": "15",
          "weekday": {
            "en": "Sunday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "19-12-1446",
          "format": "DD-MM-YYYY",
          "day": "19",
          "weekday": {
            "en": "Al Ahad",
            "ar": "الاحد"
          },
          "month": {
            "number": 12,
            "en": "Dhū al-Ḥijjah",
            "ar": "ذوالحجة",
            "days": 29
          },
          "year": "1446",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    },
    {
      "timings": {
        "Fajr": "01:33 (UTC)",
        "Sunrise": "03:48 (UTC)",
        "Dhuhr": "12:08 (UTC)",
        "Asr": "16:33 (UTC)",
        "Sunset": "20:20 (UTC)",
        "Maghrib": "20:19 (UTC)",
        "Isha": "22:34 (UTC)",
        "Imsak": "01:25 (UTC)",
        "Midnight": "23:55 (UTC)",
        "Firstthird": "22:48 (UTC)",
        "Lastthird": "01:15 (UTC)"
      },
      "date": {
        "readable": "16 Jun 2025",
        "timestamp": "1750064461",
        "gregorian": {
          "date": "16-06-2025",
          "format": "DD-MM-YYYY",
          "day": "16",
          "weekday": {
            "en": "Monday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "20-12-1446",
          "format": "DD-MM-YYYY",
          "day": "20",
          "weekday": {
            "en": "Al Athnayn",
            "ar": "الاثنين"
          },
          "month": {
            "number": 12,
            "en": "Dhū al-Ḥijjah",
            "ar": "ذوالحجة",
            "days": 29
          },
          "year": "1446",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    },
    {
      "timings": {
        "Fajr": "01:33 (UTC)",
        "Sunrise": "03:48 (UTC)",
        "Dhuhr": "12:09 (UTC)",
        "Asr": "16:33 (UTC)",
        "Sunset": "20:21 (UTC)",
        "Maghrib": "20:20 (UTC)",
        "Isha": "22:34 (UTC)",
        "Imsak": "01:25 (UTC)",
        "Midnight": "23:56 (UTC)",
        "Firstthird": "22:48 (UTC)",
        "Lastthird": "01:15 (UTC)"
      },
      "date": {
        "readable": "17 Jun 2025",
        "timestamp": "1750150861",
        "gregorian": {
          "date": "17-06-2025",
          "format": "DD-MM-YYYY",
          "day": "17",
          "weekday": {
            "en": "Tuesday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "21-12-1446",
          "format": "DD-MM-YYYY",
          "day": "21",
          "weekday": {
            "en": "Al Thalaata",
            "ar": "الثلاثاء"
          },
          "month": {
            "number": 12,
            "en": "Dhū al-Ḥijjah",
            "ar": "ذوالحجة",
            "days": 29
          },
          "year": "1446",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    },
    {
      "timings": {
        "Fajr": "01:33 (UTC)",
        "Sunrise": "03:48 (UTC)",
        "Dhuhr": "12:09 (UTC)",
        "Asr": "16:34 (UTC)",
        "Sunset": "20:21 (UTC)",
        "Maghrib": "20:20 (UTC)",
        "Isha": "22:34 (UTC)",
        "Imsak": "01:25 (UTC)",
        "Midnight": "23:56 (UTC)",
        "Firstthird": "22:48 (UTC)",
        "Lastthird": "01:15 (UTC)"
      },
      "date": {
        "readable": "18 Jun 2025",
        "timestamp": "1750237261",
        "gregorian": {
          "date": "18-06-2025",
          "format": "DD-MM-YYYY",
          "day": "18",
          "weekday": {
            "en": "Wednesday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "22-12-1446",
          "format": "DD-MM-YYYY",
          "day": "22",
          "weekday": {
            "en": "Al Arba'a",
            "ar": "الاربعاء"
          },
          "month": {
            "number": 12,
            "en": "Dhū al-Ḥijjah",
            "ar": "ذوالحجة",
            "days": 29
          },
          "year": "1446",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    },
    {
      "timings": {
        "Fajr": "01:33 (UTC)",
        "Sunrise": "03:48 (UTC)",
        "Dhuhr": "12:09 (UTC)",
        "Asr": "16:34 (UTC)",
        "Sunset": "20:21 (UTC)",
        "Maghrib": "20:20 (UTC)",
        "Isha": "22:34 (UTC)",
        "Imsak": "01:25 (UTC)",
        "Midnight": "23:56 (UTC)",
        "Firstthird": "22:48 (UTC)",
        "Lastthird": "01:16 (UTC)"
      },
      "date": {
        "readable": "19 Jun 2025",
        "timestamp": "1750323661",
        "gregorian": {
          "date": "19-06-2025",
          "format": "DD-MM-YYYY",
          "day": "19",
          "weekday": {
            "en": "Thursday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "23-12-1446",
          "format": "DD-MM-YYYY",
          "day": "23",
          "weekday": {
            "en": "Al Khamees",
            "ar": "الخميس"
          },
          "month": {
            "number": 12,
            "en": "Dhū al-Ḥijjah",
            "ar": "ذوالحجة",
            "days": 29
          },
          "year": "1446",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    },
    {
      "timings": {
        "Fajr": "01:34 (UTC)",
        "Sunrise": "03:48 (UTC)",
        "Dhuhr": "12:09 (UTC)",
        "Asr": "16:34 (UTC)",
        "Sunset": "20:21 (UTC)",
        "Maghrib": "20:20 (UTC)",
        "Isha": "22:35 (UTC)",
        "Imsak": "01:26 (UTC)",
        "Midnight": "23:56 (UTC)",
        "Firstthird": "22:49 (UTC)",
        "Lastthird": "01:16 (UTC)"
      },
      "date": {
        "readable": "20 Jun 2025",
        "timestamp": "1750410061",
        "gregorian": {
          "date": "20-06-2025",
          "format": "DD-MM-YYYY",
          "day": "20",
          "weekday": {
            "en": "Friday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "24-12-1446",
          "format": "DD-MM-YYYY",
          "day": "24",
          "weekday": {
            "en": "Al Juma'a",
            "ar": "الجمعة"
          },
          "month": {
            "number": 12,
            "en": "Dhū al-Ḥijjah",
            "ar": "ذوالحجة",
            "days": 29
          },
          "year": "1446",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    },
    {
      "timings": {
        "Fajr": "01:34 (UTC)",
        "Sunrise": "03:48 (UTC)",
        "Dhuhr": "12:09 (UTC)",
        "Asr": "16:34 (UTC)",
        "Sunset": "20:22 (UTC)",
        "Maghrib": "20:21 (UTC)",
        "Isha": "22:35 (UTC)",
        "Imsak": "01:26 (UTC)",
        "Midnight": "23:56 (UTC)",
        "Firstthird": "22:49 (UTC)",
        "Lastthird": "01:16 (UTC)"
      },
      "date": {
        "readable": "21 Jun 2025",
        "timestamp": "1750496461",
        "gregorian": {
          "date": "21-06-2025",
          "format": "DD-MM-YYYY",
          "day": "21",
          "weekday": {
            "en": "Saturday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "25-12-1446",
          "format": "DD-MM-YYYY",
          "day": "25",
          "weekday": {
            "en": "Al Sabt",
            "ar": "السبت"
          },
          "month": {
            "number": 12,
            "en": "Dhū al-Ḥijjah",
            "ar": "ذوالحجة",
            "days": 29
          },
          "year": "1446",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    },
    {
      "timings": {
        "Fajr": "01:34 (UTC)",
        "Sunrise": "03:48 (UTC)",
        "Dhuhr": "12:10 (UTC)",
        "Asr": "16:34 (UTC)",
        "Sunset": "20:22 (UTC)",
        "Maghrib": "20:21 (UTC)",
        "Isha": "22:35 (UTC)",
        "Imsak": "01:26 (UTC)",
        "Midnight": "23:57 (UTC)",
        "Firstthird": "22:49 (UTC)",
        "Lastthird": "01:16 (UTC)"
      },
      "date": {
        "readable": "22 Jun 2025",
        "timestamp": "1750582861",
        "gregorian": {
          "date": "22-06-2025",
          "format": "DD-MM-YYYY",
          "day": "22",
          "weekday": {
            "en": "Sunday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "26-12-1446",
          "format": "DD-MM-YYYY",
          "day": "26",
          "weekday": {
            "en": "Al Ahad",
            "ar": "الاحد"
          },
          "month": {
            "number": 12,
            "en": "Dhū al-Ḥijjah",
            "ar": "ذوالحجة",
            "days": 29
          },
          "year": "1446",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    },
    {
      "timings": {
        "Fajr": "01:34 (UTC)",
        "Sunrise": "03:49 (UTC)",
        "Dhuhr": "12:10 (UTC)",
        "Asr": "16:35 (UTC)",
        "Sunset": "20:22 (UTC)",
        "Maghrib": "20:21 (UTC)",
        "Isha": "22:35 (UTC)",
        "Imsak": "01:26 (UTC)",
        "Midnight": "23:57 (UTC)",
        "Firstthird": "22:49 (UTC)",
        "Lastthird": "01:16 (UTC)"
      },
      "date": {
        "readable": "23 Jun 2025",
        "timestamp": "1750669261",
        "gregorian": {
          "date": "23-06-2025",
          "format": "DD-MM-YYYY",
          "day": "23",
          "weekday": {
            "en": "Monday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "27-12-1446",
          "format": "DD-MM-YYYY",
          "day": "27",
          "weekday": {
            "en": "Al Athnayn",
            "ar": "الاثنين"
          },
          "month": {
            "number": 12,
            "en": "Dhū al-Ḥijjah",
            "ar": "ذوالحجة",
            "days": 29
          },
          "year": "1446",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    },
    {
      "timings": {
        "Fajr": "01:34 (UTC)",
        "Sunrise": "03:49 (UTC)",
        "Dhuhr": "12:10 (UTC)",
        "Asr": "16:35 (UTC)",
        "Sunset": "20:22 (UTC)",
        "Maghrib": "20:21 (UTC)",
        "Isha": "22:35 (UTC)",
        "Imsak": "01:26 (UTC)",
        "Midnight": "23:57 (UTC)",
        "Firstthird": "22:49 (UTC)",
        "Lastthird": "01:17 (UTC)"
      },
      "date": {
        "readable": "24 Jun 2025",
        "timestamp": "1750755661",
        "gregorian": {
          "date": "24-06-2025",
          "format": "DD-MM-YYYY",
          "day": "24",
          "weekday": {
            "en": "Tuesday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "28-12-1446",
          "format": "DD-MM-YYYY",
          "day": "28",
          "weekday": {
            "en": "Al Thalaata",
            "ar": "الثلاثاء"
          },
          "month": {
            "number": 12,
            "en": "Dhū al-Ḥijjah",
            "ar": "ذوالحجة",
            "days": 29
          },
          "year": "1446",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    },
    {
      "timings": {
        "Fajr": "01:35 (UTC)",
        "Sunrise": "03:49 (UTC)",
        "Dhuhr": "12:10 (UTC)",
        "Asr": "16:35 (UTC)",
        "Sunset": "20:22 (UTC)",
        "Maghrib": "20:21 (UTC)",
        "Isha": "22:35 (UTC)",
        "Imsak": "01:27 (UTC)",
        "Midnight": "23:57 (UTC)",
        "Firstthird": "22:49 (UTC)",
        "Lastthird": "01:17 (UTC)"
      },
      "date": {
        "readable": "25 Jun 2025",
        "timestamp": "1750842061",
        "gregorian": {
          "date": "25-06-2025",
          "format": "DD-MM-YYYY",
          "day": "25",
          "weekday": {
            "en": "Wednesday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "29-12-1446",
          "format": "DD-MM-YYYY",
          "day": "29",
          "weekday": {
            "en": "Al Arba'a",
            "ar": "الاربعاء"
          },
          "month": {
            "number": 12,
            "en": "Dhū al-Ḥijjah",
            "ar": "ذوالحجة",
            "days": 29
          },
          "year": "1446",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    },
    {
      "timings": {
        "Fajr": "01:35 (UTC)",
        "Sunrise": "03:50 (UTC)",
        "Dhuhr": "12:10 (UTC)",
        "Asr": "16:35 (UTC)",
        "Sunset": "20:22 (UTC)",
        "Maghrib": "20:21 (UTC)",
        "Isha": "22:35 (UTC)",
        "Imsak": "01:27 (UTC)",
        "Midnight": "23:57 (UTC)",
        "Firstthird": "22:50 (UTC)",
        "Lastthird": "01:17 (UTC)"
      },
      "date": {
        "readable": "26 Jun 2025",
        "timestamp": "1750928461",
        "gregorian": {
          "date": "26-06-2025",
          "format": "DD-MM-YYYY",
          "day": "26",
          "weekday": {
            "en": "Thursday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "01-01-1447",
          "format": "DD-MM-YYYY",
          "day": "1",
          "weekday": {
            "en": "Al Khamees",
            "ar": "الخميس"
          },
          "month": {
            "number": 1,
            "en": "Muḥarram",
            "ar": "مُحَرَّم",
            "days": 30
          },
          "year": "1447",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    },
    {
      "timings": {
        "Fajr": "01:35 (UTC)",
        "Sunrise": "03:50 (UTC)",
        "Dhuhr": "12:11 (UTC)",
        "Asr": "16:35 (UTC)",
        "Sunset": "20:22 (UTC)",
        "Maghrib": "20:21 (UTC)",
        "Isha": "22:36 (UTC)",
        "Imsak": "01:27 (UTC)",
        "Midnight": "23:58 (UTC)",
        "Firstthird": "22:50 (UTC)",
        "Lastthird": "01:18 (UTC)"
      },
      "date": {
        "readable": "27 Jun 2025",
        "timestamp": "1751014861",
        "gregorian": {
          "date": "27-06-2025",
          "format": "DD-MM-YYYY",
          "day": "27",
          "weekday": {
            "en": "Friday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "02-01-1447",
          "format": "DD-MM-YYYY",
          "day": "2",
          "weekday": {
            "en": "Al Juma'a",
            "ar": "الجمعة"
          },
          "month": {
            "number": 1,
            "en": "Muḥarram",
            "ar": "مُحَرَّم",
            "days": 30
          },
          "year": "1447",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    },
    {
      "timings": {
        "Fajr": "01:36 (UTC)",
        "Sunrise": "03:51 (UTC)",
        "Dhuhr": "12:11 (UTC)",
        "Asr": "16:35 (UTC)",
        "Sunset": "20:22 (UTC)",
        "Maghrib": "20:21 (UTC)",
        "Isha": "22:36 (UTC)",
        "Imsak": "01:28 (UTC)",
        "Midnight": "23:58 (UTC)",
        "Firstthird": "22:50 (UTC)",
        "Lastthird": "01:18 (UTC)"
      },
      "date": {
        "readable": "28 Jun 2025",
        "timestamp": "1751101261",
        "gregorian": {
          "date": "28-06-2025",
          "format": "DD-MM-YYYY",
          "day": "28",
          "weekday": {
            "en": "Saturday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "03-01-1447",
          "format": "DD-MM-YYYY",
          "day": "3",
          "weekday": {
            "en": "Al Sabt",
            "ar": "السبت"
          },
          "month": {
            "number": 1,
            "en": "Muḥarram",
            "ar": "مُحَرَّم",
            "days": 30
          },
          "year": "1447",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    },
    {
      "timings": {
        "Fajr": "01:36 (UTC)",
        "Sunrise": "03:51 (UTC)",
        "Dhuhr": "12:11 (UTC)",
        "Asr": "16:36 (UTC)",
        "Sunset": "20:22 (UTC)",
        "Maghrib": "20:21 (UTC)",
        "Isha": "22:36 (UTC)",
        "Imsak": "01:28 (UTC)",
        "Midnight": "23:58 (UTC)",
        "Firstthird": "22:50 (UTC)",
        "Lastthird": "01:18 (UTC)"
      },
      "date": {
        "readable": "29 Jun 2025",
        "timestamp": "1751187661",
        "gregorian": {
          "date": "29-06-2025",
          "format": "DD-MM-YYYY",
          "day": "29",
          "weekday": {
            "en": "Sunday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "04-01-1447",
          "format": "DD-MM-YYYY",
          "day": "4",
          "weekday": {
            "en": "Al Ahad",
            "ar": "الاحد"
          },
          "month": {
            "number": 1,
            "en": "Muḥarram",
            "ar": "مُحَرَّم",
            "days": 30
          },
          "year": "1447",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    },
    {
      "timings": {
        "Fajr": "01:36 (UTC)",
        "Sunrise": "03:52 (UTC)",
        "Dhuhr": "12:11 (UTC)",
        "Asr": "16:36 (UTC)",
        "Sunset": "20:21 (UTC)",
        "Maghrib": "20:20 (UTC)",
        "Isha": "22:36 (UTC)",
        "Imsak": "01:28 (UTC)",
        "Midnight": "23:58 (UTC)",
        "Firstthird": "22:50 (UTC)",
        "Lastthird": "01:18 (UTC)"
      },
      "date": {
        "readable": "30 Jun 2025",
        "timestamp": "1751274061",
        "gregorian": {
          "date": "30-06-2025",
          "format": "DD-MM-YYYY",
          "day": "30",
          "weekday": {
            "en": "Monday"
          },
          "month": {
            "number": 6,
            "en": "June"
          },
          "year": "2025",
          "designation": {
            "abbreviated": "AD",
            "expanded": "Anno Domini"
          },
          "lunarSighting": false
        },
        "hijri": {
          "date": "05-01-1447",
          "format": "DD-MM-YYYY",
          "day": "5",
          "weekday": {
            "en": "Al Athnayn",
            "ar": "الاثنين"
          },
          "month": {
            "number": 1,
            "en": "Muḥarram",
            "ar": "مُحَرَّم",
            "days": 30
          },
          "year": "1447",
          "designation": {
            "abbreviated": "AH",
            "expanded": "Anno Hegirae"
          },
          "holidays": [],
          "adjustedHolidays": [],
          "method": "UAQ"
        }
      },
      "meta": {
        "latitude": 51.5194682,
        "longitude": -0.1360365,
        "timezone": "UTC",
        "method": {
          "id": 3,
          "name": "Muslim World League",
          "params": {
            "Fajr": 18,
            "Isha": 17
          },
          "location": {
            "latitude": 51.5194682,
            "longitude": -0.1360365
          }
        },
        "latitudeAdjustmentMethod": "ANGLE_BASED",
        "midnightMode": "STANDARD",
        "school": "STANDARD",
        "offset": {
          "Imsak": "5",
          "Fajr": "3",
          "Sunrise": "5",
          "Dhuhr": "7",
          "Asr": "9",
          "Maghrib": "-1",
          "Sunset": 0,
          "Isha": "8",
          "Midnight": "-6"
        }
      }
    }
  ]
};

/**
 * Generate sample data for any date using the base June 2025 data as a template
 * with realistic prayer time variations throughout the month
 */
export function generateSampleDataForDate(targetDate: string): DayPrayerTimes {
  // Parse the target date
  const [year, month, day] = targetDate.split('-');
  const dayOfMonth = parseInt(day);
  
  // Only generate data for June 2025
  if (year !== '2025' || month !== '06' || dayOfMonth < 1 || dayOfMonth > 30) {
    throw new Error(`Sample data not available for ${targetDate}. Only June 1-30, 2025 is supported.`);
  }
  
  // Use June 1, 2025 as the base template
  const baseData = SAMPLE_PRAYER_DATA.data[0];
  
  // Create adjusted hijri date with proper calculation
  // Map June 2025 to Dhū al-Ḥijjah 1446 (Islamic calendar)
  const hijriDay = dayOfMonth + 4; // June 1 = 5 Dhū al-Ḥijjah
  const hijriDateString = `${hijriDay.toString().padStart(2, '0')} Dhū al-Ḥijjah 1446 AH`;
  
  // Extract and format prayer times with realistic variations
  const extractTime = (timeString: string): string => {
    return timeString.replace(' (UTC)', '');
  };

  // Apply realistic variations in prayer times throughout June (UK summer)
  const getVariedTime = (baseTime: string, dayOffset: number, prayerType: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'): string => {
    const [hours, minutes] = baseTime.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;
    
    // Apply realistic variations based on summer solstice progression
    // June in UK: days get longer until solstice (~21st), then slightly shorter
    const solsticeDay = 21;
    const progressToSolstice = Math.min(dayOffset, solsticeDay - 1) / (solsticeDay - 1);
    const progressFromSolstice = Math.max(0, dayOffset - solsticeDay) / (30 - solsticeDay);
    
    switch (prayerType) {
      case 'fajr':
        // Fajr gets earlier until solstice, then slightly later
        totalMinutes -= Math.floor(progressToSolstice * 8); // Up to 8 minutes earlier
        totalMinutes += Math.floor(progressFromSolstice * 2); // Then 2 minutes later
        break;
      case 'dhuhr':
        // Dhuhr changes minimally (solar noon)
        totalMinutes += Math.floor(dayOffset * 0.1);
        break;
      case 'asr':
        // Asr gets later throughout the month
        totalMinutes += Math.floor(dayOffset * 0.4);
        break;
      case 'maghrib':
        // Maghrib (sunset) gets later until solstice, then earlier
        totalMinutes += Math.floor(progressToSolstice * 15); // Up to 15 minutes later
        totalMinutes -= Math.floor(progressFromSolstice * 3); // Then 3 minutes earlier
        break;
      case 'isha':
        // Isha follows maghrib pattern but with smaller variations
        totalMinutes += Math.floor(progressToSolstice * 10); // Up to 10 minutes later
        totalMinutes -= Math.floor(progressFromSolstice * 2); // Then 2 minutes earlier
        break;
    }
    
    // Ensure time stays within valid ranges
    totalMinutes = Math.max(0, Math.min(1439, totalMinutes));
    
    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;
    
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  };

  const dayOffset = dayOfMonth - 1; // 0-29 for June days

  const prayers: PrayerTime[] = [
    {
      name: 'fajr' as PrayerName,
      time: getVariedTime(extractTime(baseData.timings.Fajr), dayOffset, 'fajr'),
      originalTime: getVariedTime(extractTime(baseData.timings.Fajr), dayOffset, 'fajr'),
      adjustment: 0,
      notificationEnabled: true,
      isNotified: false,
    },
    {
      name: 'dhuhr' as PrayerName,
      time: getVariedTime(extractTime(baseData.timings.Dhuhr), dayOffset, 'dhuhr'),
      originalTime: getVariedTime(extractTime(baseData.timings.Dhuhr), dayOffset, 'dhuhr'),
      adjustment: 0,
      notificationEnabled: true,
      isNotified: false,
    },
    {
      name: 'asr' as PrayerName,
      time: getVariedTime(extractTime(baseData.timings.Asr), dayOffset, 'asr'),
      originalTime: getVariedTime(extractTime(baseData.timings.Asr), dayOffset, 'asr'),
      adjustment: 0,
      notificationEnabled: true,
      isNotified: false,
    },
    {
      name: 'maghrib' as PrayerName,
      time: getVariedTime(extractTime(baseData.timings.Maghrib), dayOffset, 'maghrib'),
      originalTime: getVariedTime(extractTime(baseData.timings.Maghrib), dayOffset, 'maghrib'),
      adjustment: 0,
      notificationEnabled: true,
      isNotified: false,
    },
    {
      name: 'isha' as PrayerName,
      time: getVariedTime(extractTime(baseData.timings.Isha), dayOffset, 'isha'),
      originalTime: getVariedTime(extractTime(baseData.timings.Isha), dayOffset, 'isha'),
      adjustment: 0,
      notificationEnabled: true,
      isNotified: false,
    },
  ];

  return {
    date: targetDate,
    hijriDate: hijriDateString,
    prayers,
    location: {
      city: 'London',
      country: 'UK',
      latitude: baseData.meta.latitude,
      longitude: baseData.meta.longitude,
    },
    method: {
      id: baseData.meta.method.id,
      name: baseData.meta.method.name,
      description: `Calculation method used for ${baseData.meta.method.name}`,
    },
  };
}

/**
 * Check if a date is within the available sample data range
 */
export function isDateInSampleRange(date: string): boolean {
  const availableDates = SAMPLE_PRAYER_DATA.data.map(item => {
    const [day, month, year] = item.date.gregorian.date.split('-');
    return `${year}-${month}-${day}`;
  });
  return availableDates.includes(date);
}

/**
 * Get the default demo date (June 1, 2025) for consistent sample data experience
 */
export function getDefaultDemoDate(): string {
  return '2025-06-01';
}

/**
 * Get prayer times using sample data (for development)
 */
export function getSamplePrayerTimes(date: string): DayPrayerTimes | null {
  // First try to get actual sample data
  const actualSampleData = findPrayerTimesForDate(SAMPLE_PRAYER_DATA, date);
  if (actualSampleData) {
    return actualSampleData;
  }
  
  // If no actual sample data, generate fallback using the template
  return generateSampleDataForDate(date);
} 