# Texte für den Store-Eintrag (Partner Center)

Zum Kopieren in Partner Center. Sprache des Eintrags: **Deutsch (de-DE)**, passend zum Paket.

## Produktname

Pomodoro-Widget

(Muss genau so in `msix/identity.json` bei `DisplayName` stehen. Falls der Name schon vergeben ist, einen anderen reservieren und beide Stellen anpassen.)

## Beschreibung

Ein kleines, schwebendes Pomodoro-Timer-Widget für deinen Desktop.

Stell den Timer, arbeite konzentriert, und wenn die Zeit um ist, meldet sich das Widget mit Musik und taucht wieder auf, auch wenn du es versteckt hattest.

So funktioniert es:
• Start, Pause und Reset mit einem Klick
• 25 Minuten als Standard, dazu Schnellauswahl für 5, 10, 15, 30 und 60 Minuten
• Bleibt immer im Vordergrund, braucht keinen Platz in der Taskleiste
• Mausrad über dem Widget macht es durchsichtiger oder deutlicher
• Einfach an eine freie Stelle ziehen und mit dem Schloss festpinnen
• Mit dem Auge im Infobereich verstecken, ein Klick auf das Tray-Icon holt es zurück

Keine Werbung, kein Konto, keine Datensammlung. Der Quellcode ist offen (MIT-Lizenz) auf GitHub.

## Produktfunktionen (je eine Zeile)

- Pomodoro-Timer mit Start, Pause und Reset
- Schnellauswahl: 5, 10, 15, 30 und 60 Minuten
- Immer im Vordergrund, ohne Taskleisten-Eintrag
- Deckkraft per Mausrad einstellbar
- Verschiebbar und festpinnbar
- Alarm mit Musik, Widget erscheint automatisch wieder
- Keine Werbung, kein Konto, keine Datensammlung

## Kurzbeschreibung

Schwebender Pomodoro-Timer für den Desktop: immer im Vordergrund, durchsichtig einstellbar, mit Alarm.

## Suchbegriffe

Pomodoro, Timer, Fokus, Konzentration, Produktivität, Widget, Tomate

## Weitere Angaben

| Feld | Wert |
| --- | --- |
| Kategorie | Produktivität |
| Preis | Kostenlos |
| Datenschutzrichtlinie (URL) | https://github.com/anatolij-imgrund/pomodoro-widget/blob/main/PRIVACY.md |
| Website | https://github.com/anatolij-imgrund/pomodoro-widget |
| Support-Kontakt | https://github.com/anatolij-imgrund/pomodoro-widget/issues |
| Screenshot | `msix/store-screenshot-1.png` (1920 × 1080) |
| Store-Logo | `app-icon.png` (1024 × 1024) |

## Begründung für „runFullTrust“

Partner Center fragt nach einer Begründung für diese eingeschränkte Fähigkeit. Vorschlag (Englisch, weil die Prüfer international sind):

> This is a classic Win32 desktop application built with Tauri (Rust + WebView2), packaged as MSIX. runFullTrust is required for every Win32 desktop app to run outside the app container. The app does not access the network, files or any personal data; it only shows a timer window and a tray icon.

## Altersfreigabe (IARC-Fragebogen)

Alle Fragen zu Gewalt, Sprache, Glücksspiel, Käufen, Nutzerinteraktion, Standort und Datenweitergabe mit **Nein** beantworten. Das sollte die niedrigste Altersstufe ergeben.
