# Lock In

Tracker siłowni i biegów (Vite, React, TypeScript, Firebase).

- **Plan tygodnia**: dla każdego dnia wybierasz trening siłowy (np. Push / Pull / Nogi) i zaznaczasz, czy jest bieg.
- **Dziś**: bieg odhaczasz jednym kliknięciem (opcjonalnie wpisujesz kilometry). Trening siłowy możesz odhaczyć od razu albo rozpisać serie: ciężar × powtórzenia, z podpowiedzią z poprzedniego razu.
- **Dodatkowe treningi**: w dowolny dzień możesz dopisać bieg albo siłownię spoza planu.
- **Historia**: passa treningów z rzędu, siatka ostatnich tygodni, rekordy i ostatnie ciężary w ćwiczeniach.

Dane każdego użytkownika są w Firestore pod `lockin/{uid}` (plan) oraz `lockin/{uid}/days/{RRRR-MM-DD}` (co zostało zrobione danego dnia). Inna ścieżka niż w Runs (`users/{uid}`) sprawia, że obie aplikacje mogą korzystać z jednego projektu Firebase — wtedy w regułach zostaw oba bloki z `firestore.rules`.

## Konfiguracja Firebase

1. W [konsoli Firebase](https://console.firebase.google.com/) utwórz projekt (albo użyj istniejącego).
2. Wejdź w **Authentication > Sign-in method** i włącz dostawcę **Google**.
3. W **Project settings > General > Your apps** dodaj aplikację webową i skopiuj jej konfigurację.
4. Wejdź w **Firestore Database > Create database** (tryb produkcyjny, region np. `eur3`).
5. W zakładce **Rules** wklej zawartość pliku `firestore.rules` i kliknij **Publish**.
6. Skopiuj `.env.example` do `.env` i uzupełnij wartości.

## Uruchomienie

```sh
npm install
npm run dev
```

Aplikacja działa pod adresem <http://localhost:5173/lock-in-tracker/>. Domena `localhost` jest domyślnie autoryzowana w Firebase.

## Wdrożenie na GitHub Pages

Każdy push na `main` buduje i publikuje aplikację pod adresem <https://krzysiekddo.github.io/lock-in-tracker/> (workflow `.github/workflows/deploy.yml`).

1. W **Settings > Pages** repozytorium ustaw **Source: GitHub Actions**.
2. W **Settings > Secrets and variables > Actions** dodaj wartości z `.env` jako sekrety o tych samych nazwach.
3. W konsoli Firebase, w **Authentication > Settings > Authorized domains**, dodaj `krzysiekddo.github.io` (jeśli korzystasz z tego samego projektu co Runs, domena już tam jest).
