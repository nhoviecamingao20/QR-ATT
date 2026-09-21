# Module 3 → Module 4 — What Changed in the App

> **Purpose:** A before/after guide so students know exactly what to do in the app
> to move from Module 3 (Attendance History) to Module 4 (Teacher QR Generator).
> **Assumes:** Module 3 is finished and working (scanning saves to SQLite, History lists records).

---

## THE BIG IDEA

In Module 3, the app is **student-only**: it can *read* event QR codes, but a QR
code has to come from somewhere else (a generator website, or your teacher).

In Module 4, we add a **Teacher tab** so a teacher can create an event and display
its QR code **right inside the app** — completing the loop:

```
Module 3:  teacher needs an external QR  →  student scans it
Module 4:  teacher creates the event + QR in the app  →  student scans it
```

The app now has **5 tabs**: Home, Scan, History, **Teacher**, Profile.

```
Teacher side (Module 4)                        Student side (Module 3)
─────────────────────────                      ─────────────────────────
Form → title, code, start/end                  Scan tab → camera
  ↓                                             ↓
createEvent() saves row in `events`            registerAttendance() validates + writes
  ↓                                             ↓
JSON payload built with v:1                    History tab → JOIN shows event title
  ↓
QR code rendered on screen
```

**The payoff:** the Teacher tab writes the *exact JSON* the Scan tab is designed to
read. The two sides agree on a format (`v:1`, `event`, `title`, `start`, `end`).

---

## 1. INSTALL TWO PACKAGES

```powershell
npx expo install react-native-svg
npm install react-native-qrcode-svg
```

- `react-native-svg` — renders SVG shapes natively (Expo-managed version, matches SDK 54)
- `react-native-qrcode-svg` — turns a string into a QR-code picture (pure JS on top of SVG)

**Why two?** `react-native-qrcode-svg` is a JS library; it *draws* using
`react-native-svg`, which is a native module Expo must install at the right version.

---

## 2. `lib/database.ts` — ADD ONE FUNCTION

Everything from Module 3 stays. Add a `createEvent` export at the bottom:

```ts
export type Event = {
  eventId: string;
  title: string;
  start: string;
  end: string;
};

export async function createEvent(event: Event): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'INSERT OR REPLACE INTO events (eventId, title, start, end) VALUES (?, ?, ?, ?)',
    event.eventId,
    event.title,
    event.start,
    event.end
  );
}
```

- **Same `events` table** from Module 3 — the teacher writes the row that the
  student's History `JOIN` later reads.
- **`INSERT OR REPLACE`** — if that `eventId` already exists, the old row is
  replaced with the new one (so a teacher can fix a typo). Compare this to
  Module 3's `INSERT OR IGNORE`, which refuses to touch existing rows.
- **`?` placeholders** — same SQL-injection protection as Module 3.

---

## 3. CREATE `app/(tabs)/teacher.tsx` — NEW SCREEN

The new file. It has three parts: **state**, **validation**, **form + QR**.

### 3.1 State (controlled inputs)

```tsx
const [title, setTitle] = useState('');
const [eventId, setEventId] = useState('');
const [start, setStart] = useState(toLocalISO(new Date()));
const [end, setEnd] = useState(toLocalISO(new Date(Date.now() + 60 * 60 * 1000)));
const [payload, setPayload] = useState<string | null>(null);
const [message, setMessage] = useState<string | null>(null);
```

- Each `TextInput` is **controlled**: `value={title}` + `onChangeText={setTitle}`.
  The state is the single source of truth; the input just echoes it.
- `start`/`end` are **pre-filled** to "now" and "now + 1 hour" (helper
  `toLocalISO`) so the QR is immediately valid for testing.
- `payload` — the JSON string once an event is created (drives the QR).

### 3.2 Validation (same idea as Module 3's `registerAttendance`)

```tsx
if (!event.eventId || !event.title || !event.start || !event.end) {
  setMessage('All fields are required.');
  return;
}
const startTime = new Date(event.start).getTime();
const endTime = new Date(event.end).getTime();
if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
  setMessage('Invalid date format. Use YYYY-MM-DDTHH:MM:SS');
  return;
}
if (startTime >= endTime) {
  setMessage('Start time must be before end time.');
  return;
}
```

- `Number.isNaN(...)` catches garbage dates (a bad string gives `NaN`, "not a number").
- The time-window check mirrors Module 3: the scanner *also* enforces it, so a
  teacher can't accidentally create a QR that never works.

### 3.3 Create + render the QR

```tsx
createEvent(event).then(() => {
  setMessage('Event saved! Scan the QR with the Scan tab to test it.');
  setPayload(JSON.stringify({ v: 1, ...event }));
});
```

```tsx
{payload && (
  <View style={styles.resultCard}>
    <Text style={styles.resultTitle}>Scan this QR code with the Scan tab:</Text>
    <View style={styles.qrBox}>
      <QRCode value={payload} size={200} />
    </View>
    <Text style={styles.payloadText}>{payload}</Text>
  </View>
)}
```

- `JSON.stringify({ v: 1, ...event })` builds the exact payload the scanner reads.
- `<QRCode value={payload} size={200} />` — one component, `value` = the string to
  encode. Done.

---

## 4. `app/(tabs)/_layout.tsx` — ADD THE 5TH TAB

Insert a `Tabs.Screen` between `history` and `profile` (same pattern as the others):

```tsx
<Tabs.Screen
  name="teacher"
  options={{
    title: 'Teacher',
    tabBarIcon: ({ color, focused }) => (
      <Ionicons
        name={focused ? 'clipboard' : 'clipboard-outline'}
        color={color}
        size={24}
      />
    ),
  }}
/>
```

Because it's a file-based router, adding `teacher.tsx` + this line is all it takes —
the tab appears automatically. Icon: clipboard (focused = filled, unfocused = outline).

---

## 5. CLASS FIXES — QR BUG + EASIER TIME PICKING

> Applied in class **after** Module 4 was first written. If you already finished
> sections 1–4 above, apply these two changes on top. They replace **3.1**, **3.2**
> and **3.3** for the start/end fields and the payload line.

### 5.1 Install ONE more package

```powershell
npx expo install @react-native-community/datetimepicker
```

Gives the **native Android/iOS date & time pickers**. It is bundled with Expo Go,
so students do **not** need a development build.

### 5.2 FIX — the QR was built with `eventId`, the scanner reads `event`

**Old line (3.3):**
```tsx
setPayload(JSON.stringify({ v: 1, ...event }));
```

`{ v: 1, ...event }` copies the field named `eventId`, so the QR payload came out as:

```json
{"v":1,"eventId":"EVT-...","title":"...","start":"...","end":"..."}
```

But the Scan tab checks for `payload.event` in `registerAttendance`:

```ts
if (payload.v !== 1 || !payload.event) {
  return { success: false, message: 'Not an attendance QR code.' };
}
```

The scanner never saw `event`, so every teacher QR was rejected.

**Fix — build the JSON with the exact key the scanner expects:**
```tsx
setPayload(
  JSON.stringify({
    v: 1,
    event: event.eventId,
    title: event.title,
    start: event.start,
    end: event.end,
  })
);
```

**Rule of thumb:** the object the teacher writes into the QR must match the keys
`registerAttendance` reads (`v`, `event`, `title`, `start`, `end`) — that is the
"contract" between the two tabs.

### 5.3 NEW — start/end use native pickers instead of typing ISO text

**Old:** two `TextInput`s where students type `2026-08-07T09:00:00` by hand
(too easy to make a typo → "Invalid date format").

**New:** tappable fields open the native picker, and shortcut chips set the end
time in one tap.

**State — replace the string states with `Date` states:**
```tsx
// OLD
const [start, setStart] = useState(toLocalISO(new Date()));
const [end, setEnd] = useState(toLocalISO(new Date(Date.now() + 60 * 60 * 1000)));

// NEW
const [startDate, setStartDate] = useState(() => new Date());
const [endDate, setEndDate] = useState(() => new Date(Date.now() + 60 * 60 * 1000));
const [editTarget, setEditTarget] = useState<'start' | 'end' | null>(null);
const [editingPart, setEditingPart] = useState<'date' | 'time'>('date');
```

**Imports / helpers:**
```tsx
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
// add `Platform` to the existing react-native import

// shows "Aug 14, 2026 at 09:00" — friendly, human-readable
function formatDateTime(date: Date) { ... }

// builds "2026-08-14T09:00:00" — the exact format the scanner and DB expect
function toLocalISO(date: Date) { ... }
```

**UI — replaces the two start/end `TextInput`s:**
```tsx
<PickerField value={formatDateTime(startDate)} icon="sunny-outline" onPress={() => openPicker('start')} />
<PickerField value={formatDateTime(endDate)} icon="moon-outline" onPress={() => openPicker('end')} />
```
Plus a chip row below "Ends": **+30 min / +1 hour / +2 hours**, which set
`endDate = startDate + offset` in one tap.

**The picker renders at the bottom of the form:**
```tsx
{editTarget && (
  <DateTimePicker
    value={editTarget === 'start' ? startDate : endDate}
    mode={isAndroid ? editingPart : 'datetime'}
    display={isAndroid ? 'default' : 'spinner'}
    onChange={onPickerChange}
  />
)}
```
- **Android** shows two dialogs: date first, then time (`editingPart`).
- **iOS** shows one inline spinner for both (`datetime`).
- **Dismissing** the picker keeps the old value — no change.

**Validation — one check is now gone:**
- OLD: `Number.isNaN(startTime)` — needed because a bad typed string becomes `NaN`.
- NEW: the picker can only produce a valid `Date`, so that check is deleted.
  Only two checks remain: title + event code are not empty, and `endDate > startDate`.

**What does NOT change:** the QR payload still stores `YYYY-MM-DDTHH:MM:SS` strings
(built with `toLocalISO` at the moment you tap **Create Event**). The Scan tab, the
`events` table and History all keep working exactly as before.

---

## WHAT THE STUDENT SEES — BEFORE vs AFTER

| | Module 3 | Module 4 |
|---|---|---|
| Tab bar | Home, Scan, History, Profile | Home, Scan, History, **Teacher**, Profile |
| Making an event QR | External website / teacher's file | Form inside the app → QR appears on screen |
| Getting an event into the DB | Only on first scan (`INSERT OR IGNORE`) | Teacher saves it first (`INSERT OR REPLACE`) |
| Full loop | Teacher ↔ app disconnected | Create in Teacher → scan in Scan → see in History |

### How to test (full loop)

1. **Teacher tab** → fill in Title + Event Code → keep the pre-filled times →
   tap **Create Event** → QR appears.
2. **Scan tab** → point at the QR on your (or a classmate's) screen →
   green "Attendance recorded!".
3. **History tab** → the event is listed with its title (the `JOIN` works).
4. **Scan the same QR again** → red "Already registered." (dedupe still works).

---

## TROUBLESHOOTING

| Problem | Check |
|---|---|
| QR code doesn't render | Confirm both packages installed (`npm ls react-native-svg react-native-qrcode-svg`) and restart Expo |
| "All fields are required." | Title and/or event code is empty |
| (gone) "Invalid date format." | No longer possible — the picker only produces valid dates (5.3) |
| "Start time must be before end time." | End is before/equal to start — pick a later end or use a `+` chip |
| "Event has already ended." | The end time is before now — use the pre-filled times or a `+` chip |
| Scanner says "Not an attendance QR code." | Payload built with `eventId` instead of `event` — apply fix 5.2 |
| No date picker opens | Run `npx expo install @react-native-community/datetimepicker`, then restart Expo |
| No Teacher tab | Did you add the `Tabs.Screen` entry in `_layout.tsx`? |
| TypeScript errors | Run `npx tsc --noEmit` and fix what it lists |

---

## RELATED DOCS

- `module3.md` — where the database and Scan logic came from
- `module3-quiz.md` / `module1-quiz.md` — assessments so far
- `code-walkthrough.md` — every file explained line by line

*End of Module 3 → 4 Change Guide*
