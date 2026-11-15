# Lock In

Tracker siłowni i biegów (Vite, React, TypeScript, Firebase).

- **Plan tygodnia**: dla każdego dnia wybierasz trening siłowy (np. Push / Pull / Nogi) i zaznaczasz, czy jest bieg.
- **Dziś**: bieg odhaczasz jednym kliknięciem (opcjonalnie wpisujesz kilometry). Trening siłowy możesz odhaczyć od razu albo rozpisać serie: ciężar × powtórzenia, z podpowiedzią z poprzedniego razu.
- **Dodatkowe treningi**: w dowolny dzień możesz dopisać bieg albo siłownię spoza planu.
- **Historia**: passa treningów z rzędu, siatka ostatnich tygodni, rekordy i ostatnie ciężary w ćwiczeniach.

Dane każdego użytkownika są w Firestore pod `lockin/{uid}` (plan) oraz `lockin/{uid}/days/{RRRR-MM-DD}` (co zostało zrobione danego dnia).

## Firebase

Projekt Firebase: **Lock In** (`lock-in-fe8b4`) — logowanie Google, Firestore w regionie `eur3`, reguły z pliku `firestore.rules`, domena `krzysiekddo.github.io` dodana w **Authentication > Settings > Authorized domains**.

Konfiguracja webowa jest wpisana w `.github/workflows/deploy.yml`. Nie jest tajna: i tak trafia do kodu strony, a dostęp do danych pilnują reguły Firestore. Do pracy lokalnej skopiuj te same wartości do pliku `.env` (wzór w `.env.example`).

## Uruchomienie

```sh
npm install
npm run dev
```

Aplikacja działa pod adresem <http://localhost:5173/lock-in-tracker/>. Domena `localhost` jest domyślnie autoryzowana w Firebase.

## Wdrożenie na GitHub Pages

Każdy push na `main` buduje i publikuje aplikację pod adresem <https://krzysiekddo.github.io/lock-in-tracker/> (workflow `.github/workflows/deploy.yml`, **Settings > Pages > Source: GitHub Actions**).
