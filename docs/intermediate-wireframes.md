# Intermediate UI Wireframes

These wireframes document the intermediate hand-in UI flow. The design uses a master-detail workflow: users first find a tour, inspect the selected tour, then use focused forms for creating or editing tours and logs.

## UX Principles

- Keep the app tool-like and predictable: navigation at the top, tour management in the main content, and clear form pages for edits.
- Put primary commit actions on the right. Secondary actions such as Cancel appear to the left of the primary action.
- Use confirmation panels for destructive tour deletion.
- Keep route and image handling visible even during the intermediate phase: the map is represented by a clear placeholder, and cover image data is represented by a placeholder or metadata block.
- Use responsive grids that collapse into one column on narrow screens.

## 1. Tours List And Selection

```text
+--------------------------------------------------------------------------------+
| MyTour App                                                    Tours | Health     |
+--------------------------------------------------------------------------------+
| TOUR PLANNER                                                                   |
| Tours                                                        [New tour] [Edit]  |
+--------------------------------------------------------------------------------+
| [ Search by name/place/attribute                   ] [Transport v] [Clear][Apply]|
+------------------------------------------------------+-------------------------+
| Tour list                                            | Selected tour           |
|                                                      |                         |
| +------+------------------------------------------+  | +---------------------+ |
| | IMG  | Danube Island Evening Ride        Bike   |  | | cover placeholder  | |
| |      | Wien Praterstern -> Donauinsel    18 km  |  | +---------------------+ |
| +------+------------------------------------------+  | Danube Island Ride      |
| +------+------------------------------------------+  | Wien -> Donauinsel      |
| | IMG  | Kahlenberg Sunrise Hike           Hike   |  | Distance: 18 km        |
| |      | Nussdorf -> Kahlenberg            7.6 km |  | Time: 1 h 10 min       |
| +------+------------------------------------------+  | Logs: 3                |
|                                                      | Popularity: popular     |
|                                                      |                         |
|                                                      | [Open details][Edit]    |
|                                                      | [Delete]                |
|                                                      |                         |
|                                                      | Delete selected tour?   |
|                                                      | [Cancel] [Delete tour]  |
+------------------------------------------------------+-------------------------+
```

## 2. Tour Detail

```text
+--------------------------------------------------------------------------------+
| [Back to tours]                                               [Edit] [Delete]   |
+--------------------------------------------------------------------------------+
| Delete this tour?                                      [Cancel] [Delete tour]   |
+--------------------------------------------------------------------------------+
| Danube Island Evening Ride                                                     |
| Easy after-work cycling route along the Danube.                                 |
|                                                                                |
| +---------------------------------------+ +------------------------------------+ |
| | Distance: 18 km                       | | Tour Data                          | |
| | Estimated time: 1 h 10 min            | | From: Wien Praterstern             | |
| | Timezone: Europe/Vienna               | | To: Donauinsel Nord                | |
| +---------------------------------------+ | Type: Bike                         | |
|                                           +------------------------------------+ |
| +---------------------------------------+ +------------------------------------+ |
| | Cover Image                           | | Computed Attributes                | |
| | +-----------+ File/path metadata      | | Logs: 3                            | |
| | | IMG       | or placeholder          | | Popularity: popular                | |
| | +-----------+                         | | Family suitability: friendly       | |
| +---------------------------------------+ +------------------------------------+ |
|                                                                                |
| +------------------------------------------------------------------------------+ |
| | Route Map Placeholder                                                        | |
| |                                                                              | |
| |   park/grid background        Start -------- route line -------- End          | |
| |   water/terrain hint                                                         | |
| +------------------------------------------------------------------------------+ |
```

## 3. Tour Logs On Detail Page

```text
+--------------------------------------------------------------------------------+
| Tour Logs                                                        [New log]      |
+--------------------------------------------------------------------------------+
| +------------------------------------------------------------------------------+ |
| | 15 May 2026, 19:30                                                           | |
| | A bit crowded near the station, but the island section was excellent.         | |
| | Weather: 20.1 C, clear sky, 8.1 km/h wind                                    | |
| |                                                                              | |
| | Difficulty: 3/5       Distance: 18 km       Time: 1 h 16 min       Rating: 4 |
| |                                                               [Edit][Delete]  |
| +------------------------------------------------------------------------------+ |
```

## 4. Create/Edit Tour Form

```text
+--------------------------------------------------------------------------------+
| [Back to tours]                                                                 |
+--------------------------------------------------------------------------------+
| TOUR PLANNER                                                                    |
| New tour / Edit tour                                                            |
+--------------------------------------------------------------------------------+
| Basics                                                                          |
| +------------------------------------------------------------------------------+ |
| | Name                                                                         | |
| | [ Danube Island Evening Ride                                             ]   | |
| | Description                                                                  | |
| | [ Easy after-work cycling route along the Danube...                      ]   | |
| | Transport type [Bike v]             Timezone [Europe/Vienna]                 | |
| +------------------------------------------------------------------------------+ |
| Cover Image                                                                     |
| +------------------------------------------------------------------------------+ |
| | +-----------+ Cover image upload is represented as a placeholder             | |
| | | IMG       | for the intermediate hand-in.                                  | |
| | +-----------+                                                                | |
| +------------------------------------------------------------------------------+ |
| Route                                                                           |
| +------------------------------------------------------------------------------+ |
| | Start location [Wien Praterstern]      End location [Donauinsel Nord]        | |
| | Start lat [48.2189] Start lon [16.3927] End lat [48.2872] End lon [16.3674] |
| +------------------------------------------------------------------------------+ |
|                                                                  [Cancel] [Save]|
+--------------------------------------------------------------------------------+
```

## 5. Create/Edit Tour Log Form

```text
+--------------------------------------------------------------------------------+
| [Back to tour]                                                                  |
+--------------------------------------------------------------------------------+
| TOUR PLANNER                                                                    |
| New tour log / Edit tour log                                                    |
+--------------------------------------------------------------------------------+
| Accomplished Tour                                                               |
| +------------------------------------------------------------------------------+ |
| | Performed at [2026-05-31 17:30]                                               | |
| | Total distance in meters [18400]      Total time in seconds [4380]            | |
| | Difficulty [3 - Moderate v]           Rating [4 - Great v]                   | |
| +------------------------------------------------------------------------------+ |
| Comment                                                                         |
| +------------------------------------------------------------------------------+ |
| | [ Calm evening ride, light wind, good route for beginners.                ]   | |
| +------------------------------------------------------------------------------+ |
|                                                            [Cancel] [Create log]|
+--------------------------------------------------------------------------------+
```

## Responsive Behavior

```text
Desktop: list and selected-tour panel sit side by side.
Tablet: content keeps two columns where space allows.
Mobile: filters, tour rows, detail sections, map, logs, and form fields collapse to one column.
```
