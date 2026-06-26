const roadtripData = {
  "title": "California Road Trip",
  "subtitle": "August 2 - August 16",
  "days": [
    {
      "date": "Sun 2 Aug",
      "items": [
        {"type": "Activity", "title": "Land", "start": "15:45", "end": "16:30", "duration": "0h 45m", "notes": "Arrive in San Francisco."},
        {"type": "Activity", "title": "Chill in Union Square", "start": "16:30", "end": "22:00", "duration": "5h 30m", "notes": "Relax after arrival."},
        {"type": "Hotel", "title": "Barnes Hotel", "start": "22:00", "notes": "First night in SF."}
      ]
    },
    {
      "date": "Mon 3 Aug",
      "items": [
        {"type": "Activity", "title": "Open top bus", "start": "08:00", "end": "12:00", "duration": "4h 00m", "notes": "City tour."},
        {"type": "Activity", "title": "Collect Alcatraz tickets - Fisherman\'s Wharf", "start": "12:00", "end": "12:00", "duration": "0h 00m", "notes": "Ticket pickup."},
        {"type": "Activity", "title": "Open top bus", "start": "12:00", "end": "21:00", "duration": "9h 00m", "notes": "Continue exploring SF."},
        {"type": "Hotel", "title": "Barnes Hotel", "start": "21:00", "notes": "Return to hotel."}
      ]
    },
    {
      "date": "Tue 4 Aug",
      "items": [
        {"type": "Activity", "title": "Open top bus", "start": "08:00", "end": "13:00", "duration": "5h 00m", "notes": "Morning sightseeing."},
        {"type": "Activity", "title": "Alcatraz", "start": "13:00", "end": "17:00", "duration": "4h 00m", "notes": "Visit the island."},
        {"type": "Activity", "title": "Open top bus", "start": "17:00", "end": "21:00", "duration": "4h 00m", "notes": "Evening city drive."},
        {"type": "Hotel", "title": "Barnes Hotel", "start": "21:00", "notes": "Stay in SF."}
      ]
    },
    {
      "date": "Wed 5 Aug",
      "items": [
        {"type": "Activity", "title": "TBD activity", "start": "08:00", "end": "18:00", "duration": "10h 00m", "notes": "Open slot for planning."},
        {"type": "Activity", "title": "TBD activity", "start": "18:00", "end": "21:00", "duration": "3h 00m", "notes": "Evening plans."},
        {"type": "Hotel", "title": "Barnes Hotel", "start": "21:00", "notes": "Third night in SF."}
      ]
    },
    {
      "date": "Thu 6 Aug",
      "items": [
        {"type": "Activity", "title": "Checkout", "start": "10:00", "end": "10:00", "duration": "0h 00m", "notes": "Leave the hotel."},
        {"type": "Activity", "title": "Chill / sightsee", "start": "10:00", "end": "12:00", "duration": "2h 00m", "notes": "Last morning in SF."},
        {"type": "Activity", "title": "Collect rental car", "start": "12:00", "end": "13:00", "duration": "1h 00m", "notes": "Pick up the car."},
        {"type": "Travel", "title": "Drive to Groveland via I-580", "start": "13:00", "end": "16:00", "duration": "3h 00m", "notes": "Drive east toward Groveland."},
        {"type": "Activity", "title": "Chill in Groveland", "start": "16:00", "end": "21:00", "duration": "5h 00m", "notes": "Relax after the drive."},
        {"type": "Hotel", "title": "Fairway House", "start": "21:00", "notes": "First night near Groveland."}
      ]
    },
    {
      "date": "Fri 7 Aug",
      "items": [
        {"type": "Travel", "title": "Drive to Yosemite", "start": "06:00", "end": "07:00", "duration": "1h 00m", "notes": "Morning drive."},
        {"type": "Activity", "title": "Yosemite Valley", "start": "07:00", "end": "18:00", "duration": "11h 00m", "notes": "Day in Yosemite."},
        {"type": "Travel", "title": "Drive back to Groveland", "start": "18:00", "end": "19:00", "duration": "1h 00m", "notes": "Return drive."},
        {"type": "Activity", "title": "Chill in Groveland", "start": "19:00", "end": "22:00", "duration": "3h 00m", "notes": "Evening rest."},
        {"type": "Hotel", "title": "Fairway House", "start": "22:00", "notes": "Second night in Groveland."}
      ]
    },
    {
      "date": "Sat 8 Aug",
      "items": [
        {"type": "Activity", "title": "Checkout", "start": "10:00", "end": "10:00", "duration": "0h 00m", "notes": "Leave the room."},
        {"type": "Travel", "title": "Drive to San Francisco / CA-4", "start": "10:00", "end": "13:30", "duration": "3h 30m", "notes": "Travel day."},
        {"type": "Activity", "title": "TBD activity", "start": "13:30", "end": "21:00", "duration": "7h 30m", "notes": "San Francisco / Monterey options."},
        {"type": "Hotel", "title": "San Fran / Monterey vicinity?", "start": "21:00", "notes": "Overnight stay."}
      ]
    },
    {
      "date": "Sun 9 Aug",
      "items": [
        {"type": "Activity", "title": "Checkout", "start": "09:00", "end": "09:00", "duration": "0h 00m", "notes": "Leave accommodation."},
        {"type": "Travel", "title": "Drive to Morro Bay via CA-1", "start": "09:00", "end": "13:00", "duration": "4h 00m", "notes": "Highway 1 coastal drive."},
        {"type": "Activity", "title": "Morro", "start": "13:00", "notes": "Explore Morro Bay."},
        {"type": "Hotel", "title": "Morro Bay - Best Western San Marcos", "start": "17:00", "notes": "Stay in Morro Bay."}
      ]
    },
    {
      "date": "Mon 10 Aug",
      "items": [
        {"type": "Travel", "title": "Drive to Santa Barbara", "start": "09:00", "end": "11:00", "duration": "2h 00m", "notes": "Coastal drive down CA-1."},
        {"type": "Activity", "title": "County Courthouse and Stearns Wharf", "start": "11:00", "end": "15:00", "duration": "4h 00m", "notes": "Santa Barbara sightseeing."},
        {"type": "Travel", "title": "Drive to LA", "start": "19:00", "end": "20:30", "duration": "1h 30m", "notes": "Evening drive."},
        {"type": "Hotel", "title": "LA???", "start": "18:00", "notes": "LA accommodation."}
      ]
    },
    {
      "date": "Tue 11 Aug",
      "items": [
        {"type": "Activity", "title": "Celebrity homes tour and Hollywood sign", "start": "06:00", "end": "18:00", "notes": "LA day."},
        {"type": "Hotel", "title": "LA", "start": "18:00", "notes": "Overnight in Los Angeles."}
      ]
    },
    {
      "date": "Wed 12 Aug",
      "items": [
        {"type": "Activity", "title": "Griffith Observatory and Venice Canals", "start": "06:00", "end": "18:00", "notes": "Explore LA neighborhoods."},
        {"type": "Hotel", "title": "LA", "start": "18:00", "notes": "Same hotel."}
      ]
    },
    {
      "date": "Thu 13 Aug",
      "items": [
        {"type": "Activity", "title": "Universal Studios?", "start": "06:00", "end": "18:00", "notes": "Theme park day."},
        {"type": "Hotel", "title": "LA", "start": "18:00", "notes": "Stay in LA."}
      ]
    },
    {
      "date": "Fri 14 Aug",
      "items": [
        {"type": "Activity", "title": "Venice Beach / Long Beach", "start": "06:00", "end": "18:00", "notes": "Beach day."},
        {"type": "Hotel", "title": "LA", "start": "18:00", "notes": "LA hotel."}
      ]
    },
    {
      "date": "Sat 15 Aug",
      "items": [
        {"type": "Travel", "title": "Drive to San Diego via Laguna Beach", "start": "10:00", "notes": "Coastal drive to San Diego."},
        {"type": "Activity", "title": "Coronado Bridge, Little Italy, La Jolla Cove", "start": "13:00", "end": "19:00", "duration": "6h 00m", "notes": "Explore San Diego."},
        {"type": "Hotel", "title": "San Diego?", "start": "19:00", "notes": "Overnight stay."}
      ]
    },
    {
      "date": "Sun 16 Aug",
      "items": [
        {"type": "Travel", "title": "Drive to LA via Laguna Beach", "notes": "Return drive."},
        {"type": "Activity", "title": "Chill", "notes": "Rest day before departure."},
        {"type": "Activity", "title": "Return car", "notes": "Drop off rental."},
        {"type": "Activity", "title": "Arrive airport", "start": "16:30", "notes": "End of the trip."}
      ]
    }
  ]
};

window.roadtripData = roadtripData;

