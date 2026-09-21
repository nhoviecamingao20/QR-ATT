# Module 2 → Module 3 — What Changed in the App

> **Purpose:** A before/after guide so students know exactly what to do in the app
> to move from Module 2 (QR Scanner) to Module 3 (Attendance History).
> **Assumes:** Module 2 is finished and working (camera scanning works, results display).

---

## THE BIG IDEA

In Module 2, a scan shows the QR's text and then **forgets it**.
In Module 3, a scan is **saved to a database** and shown forever on the History tab.

```
Module 2:  Scan → show text → forgotten
Module 3:  Scan → validate → SAVE to SQLite → shown in History
```

Only **four** things change:

1. Install `expo-sqlite`
2. Create 2 new files
3. Edit `scan.tsx` (6 small changes)
4. Rewrite `history.tsx`

---

## 1. INSTALL ONE DEPENDENCY

```powershell
npx expo install expo-sqlite
```

This does two things automatically:
- adds `expo-sqlite` to `package.json`
- adds `"expo-sqlite"` to the `plugins` array in `app.json`

**Why `npx expo install`?** It picks the version that matches our SDK (54).
`npm install` would grab the newest version, which may not be compatible.

---

## 2. CREATE TWO NEW FILES

### `constants/student.ts` — "WHO is scanning"

```ts
export const STUDENT_ID = 'STUDENT-2026-001';
```

- One constant = the current student's ID (no login yet).
- Change the value to your own ID (e.g. `STUDENT-2026-015`).
- In a future phase, a real login replaces this constant — screens won't change.

### `lib/database.ts` — ALL database logic in one place

Create a new folder `lib/` at the project root. This file:
- opens the SQLite database (lazy singleton — opened once, reused everywhere)
- creates the tables with `CREATE TABLE IF NOT EXISTS`
- exports `registerAttendance(...)` — the recording logic
- exports `getAttendanceHistory(...)` — the query for the History tab

**Important:** screens never write SQL. They just call these two functions.
This is why `scan.tsx` and `history.tsx` stay small.

---

## 3. EDIT `app/(tabs)/scan.tsx` — SIX SMALL CHANGES

Everything from Module 2 stays (camera permission, `CameraView`, `scanned` guard,
`lastData`, Scan Again). Only extend it:

### Change 1 — Add 2 imports

```ts
import { STUDENT_ID } from '@/constants/student';
import { registerAttendance } from '@/lib/database';
```

### Change 2 — Add 2 state variables

Put these next to the existing `scanned` / `lastData` lines:

```ts
const [message, setMessage] = useState<string | null>(null);
const [success, setSuccess] = useState(false);
```

`message` = the result text. `success` = green or red.

### Change 3 — Update the scan handler (the key change)

**Before (Module 2):** the handler only stores the text.

**After (Module 3):** it also saves the attendance.

```ts
const handleBarcodeScanned = ({ data }: { data: string }) => {
  setScanned(true);
  setLastData(data);
  registerAttendance(data, STUDENT_ID).then((result) => {
    setMessage(result.message);
    setSuccess(result.success);
  });
};
```

`.then(...)` runs AFTER the database write finishes, then updates the message state.

### Change 4 — Scan Again also clears the message

**Before:**
```ts
const handleScanAgain = () => {
  setScanned(false);
  setLastData(null);
};
```

**After:**
```ts
const handleScanAgain = () => {
  setScanned(false);
  setLastData(null);
  setMessage(null);
};
```

### Change 5 — Overlay: add the result line

Add this **above** the existing `lastData` line in the overlay:

```tsx
{scanned && message && (
  <Text
    style={[styles.scanResult, success ? styles.success : styles.error]}
  >
    {message}
  </Text>
)}
```

And change the raw-text line to a smaller, gray style:

```tsx
{scanned && lastData && (
  <Text style={styles.scanData}>{lastData}</Text>
)}
```

### Change 6 — Styles: split `scanResult` into three

**Before:**
```ts
scanResult: { fontSize: 14, color: COLORS.primary, textAlign: 'center', marginBottom: 12 },
```

**After:**
```ts
scanResult: { fontSize: 14, textAlign: 'center', marginBottom: 8, fontWeight: '600' },
success:    { color: '#2E7D32' },   // green — attendance recorded
error:      { color: '#C62828' },   // red — failed / duplicate
scanData:   { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 12 },
```

---

## 4. REWRITE `app/(tabs)/history.tsx`

Replace the entire placeholder file with the real screen:

```tsx
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { STUDENT_ID } from '@/constants/student';
import { getAttendanceHistory, type AttendanceRecord } from '@/lib/database';

export default function HistoryScreen() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(() => {
    getAttendanceHistory(STUDENT_ID).then((rows) => {
      setRecords(rows);
      setLoading(false);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance History</Text>

      {loading ? (
        <Text style={styles.subtitle}>Loading records...</Text>
      ) : records.length === 0 ? (
        <Text style={styles.subtitle}>
          No records yet. Scan a QR code to register your attendance.
        </Text>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.eventTitle}>{item.eventTitle}</Text>
              <Text style={styles.eventMeta}>{item.eventId}</Text>
              <Text style={styles.eventMeta}>{formatDate(item.scannedAt)}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 32,
  },
  list: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  eventMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
```

**Key ideas in this file:**
- `FlatList` renders the array of records as scrollable cards
- `useFocusEffect` reloads the list every time the tab gains focus (sees new scans)
- The 3-way ternary shows Loading / Empty / List
- `formatDate` is a helper function at the bottom that turns ISO strings into readable dates

---

## WHAT THE STUDENT SEES — BEFORE vs AFTER

| | Module 2 | Module 3 |
|---|---|---|
| After scanning | Shows raw QR text | Green **"Attendance recorded!"** or red error message |
| Scan the same QR twice | Scans again silently | Refuses: **"Already registered."** |
| History tab | "Your past attendance records will appear here" | Real list of events (title, code, timestamp) |
| Close and reopen the app | Everything is gone | Records are **still there** (SQLite is persistent) |

---

## TROUBLESHOOTING

| Problem | Check |
|---|---|
| App error after `npx expo install` | Restart Expo: `npx expo start --clear` |
| Red squiggles on `@/lib/database` | Confirm the file is `lib/database.ts` at project root |
| History stays empty after scanning | Scan first, THEN open the History tab (data loads on focus) |
| Every QR says "Invalid QR code." | The QR must contain valid JSON with `v:1` and an `event` field |
| Scan says "Event has already ended." | The QR's `end` time is before now — regenerate it |
| TypeScript errors | Run `npx tsc --noEmit` and fix what it lists |

---

## RELATED DOCS

- `module2.md` — where the scanner came from
- `module3.md` — full lesson (data model, registration logic, SQLite)
- `code-walkthrough.md` — every file explained line by line
- `module3-quiz.md` — 20-item assessment

*End of Module 2 → 3 Change Guide*
