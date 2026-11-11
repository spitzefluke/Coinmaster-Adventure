// Admin Panel: wer Admin ist und welche Zeiten das Panel anbietet.
// Gilt für die Vorschau (spiel/) und für Roblox (Server-Skript CoinmasterAdmin, Fenster in GameUI).

// Roblox-UserIds der Admins. Die UserId steht in der Adresse des Roblox-Profils:
// roblox.com/users/<UserId>/profile. Beispiel: export const ADMIN_IDS = [123456789, 987654321];
// Der Besitzer des Spiels ist immer Admin (bei Gruppenspielen der Gruppen-Besitzer).
// Weitere Admins ohne neuen Import: in Studio unter ServerStorage einen Ordner „CoinmasterAdmins“ mit
// IntValues anlegen (Value = UserId). Den Ordner lässt der Installer stehen.
export const ADMIN_IDS = [];

export const ADMIN = {
  key: 'F2', // Taste zum Öffnen (dazu der Menüknopf „Admin“)
  weatherMinutes: [5, 10, 15, 30], // Wetter erzwingen für …
  clocks: [
    { id: 'morgen', name: 'Morgen', hour: 7 },
    { id: 'mittag', name: 'Mittag', hour: 12 },
    { id: 'abend', name: 'Abend', hour: 18.2 },
    { id: 'nacht', name: 'Nacht', hour: 0 },
  ],
  eventMinutes: [10, 30, 60], // Server-Boost für alle für …
  bans: [
    { id: 'stunde', name: '1 Stunde', minutes: 60 },
    { id: 'tag', name: '1 Tag', minutes: 1440 },
    { id: 'woche', name: '7 Tage', minutes: 10080 },
    { id: 'immer', name: 'Für immer', minutes: 0 },
  ],
  announceMax: 160, // Zeichen einer Ansage
};
