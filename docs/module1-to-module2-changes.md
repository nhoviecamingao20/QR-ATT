# Module 1 → Module 2 — What Changed in the App

> **Purpose:** A before/after guide so students know exactly what to do in the app
> to move from Module 1 (App Structure & Home Screen) to Module 2 (QR Scanner).
> **Assumes:** Module 1 is finished and working (Home screen, 4 tabs, Header/AppButton components).

---

## THE BIG IDEA

In Module 1, the Scan tab is a **placeholder** — just text that says the scanner
"will be implemented in Phase 2."

In Module 2, we turn that tab into a **real camera QR scanner** with permission
handling.

```
Module 1:  Scan tab = placeholder text
Module 2:  Scan tab = live camera that reads QR codes
```

Only **one** tab screen changes. Everything else (Home, History, Profile, tabs,
Header, AppButton, colors) stays exactly as Module 1 left it.

---

## 1. INSTALL ONE DEPENDENCY

```powershell
npx expo install expo-camera
```

This adds `expo-camera` to `package.json` at a version compatible with our SDK (54).

**Why `npx expo install`?** It picks the right version for SDK 54.
`npm install` would grab the newest version, which may not work in Expo Go 54.

**After installing:** stop the server (`Ctrl+C`) and run `npx expo start` again
so Expo loads the new native module.

---

## 2. REWRITE `app/(tabs)/scan.tsx`

The whole file is replaced. Start from the Module 1 placeholder:

**Before (Module 1 placeholder):**
```tsx
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/colors';

export default function ScanScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>QR Scanner</Text>
      <Text style={styles.subtitle}>
        The QR scanner will be implemented in Phase 2.
      </Text>
    </View>
  );
}
```

**After (Module 2):** replace the entire file with:

```tsx
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import { COLORS } from '@/constants/colors';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [lastData, setLastData] = useState<string | null>(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Camera Permission Needed</Text>
        <Text style={styles.subtitle}>
          We need access to your camera to scan QR codes.
        </Text>
        <AppButton
          theme="primary"
          title="Grant Permission"
          icon="camera"
          onPress={requestPermission}
        />
      </View>
    );
  }

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    setLastData(data);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      <View style={styles.overlay}>
        <Text style={styles.overlayText}>
          {scanned ? 'QR Code detected!' : 'Point your camera at a QR code'}
        </Text>

        {scanned && lastData && (
          <Text style={styles.scanResult}>{lastData}</Text>
        )}

        {scanned && (
          <AppButton
            theme="primary"
            title="Scan Again"
            icon="refresh"
            onPress={() => setScanned(false)}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  overlay: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 60,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  overlayText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  scanResult: {
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
});
```

---

## WHAT'S NEW IN THIS FILE

### The 3 permission states

The screen can be in 3 situations, chosen with `if` + early `return`:

```
permission === null        → still loading → render empty View
permission.granted === false → denied      → show "Grant Permission" button
permission.granted === true  → allowed     → show the camera
```

This is the same conditional rendering idea as `AppButton`'s `theme` prop, just
with more branches.

### The `useCameraPermissions` hook

```ts
const [permission, requestPermission] = useCameraPermissions();
```

- `permission` — the current permission state (`null` while loading)
- `requestPermission` — the function that shows the system dialog, called by the
  "Grant Permission" button

This is our **first real use of `useState`** — the fundamentals doc promised:
> "We don't use state in Phase 1, but will in Phase 2."

### `CameraView` props

| Prop | What it does |
|---|---|
| `facing="back"` | Use the rear camera |
| `barcodeScannerSettings={{ barcodeTypes: ['qr'] }}` | Only detect QR codes |
| `onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}` | Run the handler on a scan — but turn it OFF after the first hit |

### The `scanned` guard

Without it, `onBarcodeScanned` fires over and over while the same QR is in view.
`setScanned(true)` stops it after the first scan. "Scan Again" runs
`setScanned(false)` to restart it.

---

## OPTIONAL (Going Further) — Not Required

These two extras are covered in `module2.md` sections 7–8 but are **not needed**
for the core lesson:

1. **`app.json` config plugin** — add `expo-camera` to `plugins` so a future
   standalone build shows a friendly permission message. Ignored in Expo Go.
2. **`useIsFocused`** — unmount the camera when the Scan tab is not focused
   (React Navigation hook, useful but optional).

---

## WHAT THE STUDENT SEES — BEFORE vs AFTER

| | Module 1 | Module 2 |
|---|---|---|
| Scan tab | Placeholder text | Live camera preview |
| First open | Nothing | System permission dialog → "Allow" |
| Permission denied | — | Friendly screen with "Grant Permission" button |
| Point at a QR | — | Shows the QR's text + "Scan Again" button |
| Same QR still in view | — | Stops scanning (guard) until "Scan Again" |

---

## TROUBLESHOOTING

| Problem | Check |
|---|---|
| App error after `npx expo install` | Restart Expo: `npx expo start --clear` |
| Camera shows nothing / black | Permission not granted yet — tap the Grant button |
| "QR won't scan" | Keep the QR in the camera frame; make sure it's a QR, not a barcode |
| Test on web instead of phone | Browser needs HTTPS for camera access; a phone + Expo Go is easier |
| `barcodeTypes: ['QR']` error | Must be lowercase: `'qr'` |
| Camera keeps re-scanning | The `scanned` guard is missing — check `onBarcodeScanned` |
| TypeScript errors | Run `npx tsc --noEmit` and fix what it lists |

---

## RELATED DOCS

- `module1.md` — App Structure & Home Screen (where we started)
- `module2.md` — full lesson (permissions, CameraView, scan guard)
- `module2-to-module3-changes.md` — the next step (saving scans to SQLite)
- `code-walkthrough.md` — every file explained line by line
- `module1-quiz.md` / `module3-quiz.md` — assessments

*End of Module 1 → 2 Change Guide*
