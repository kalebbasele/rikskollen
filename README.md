# RiksKollen 🇸🇪

En mobilapp för unga svenska väljare som förklarar riksdagsdebatter och omröstningar på ett enkelt sätt.

## Kom igång

### 1. Installera beroenden
```bash
npm install
```

### 2. Konfigurera API-nyckel
```bash
cp .env.example .env
```
Öppna `.env` och lägg in din Anthropic API-nyckel från [console.anthropic.com](https://console.anthropic.com/).

### 3. Starta utvecklingsservern
```bash
npm run dev
```

Öppna [http://localhost:5173](http://localhost:5173) i din webbläsare.

## Hur det fungerar

### Data
- **Debatter** hämtas från riksdagens webb-TV API: `https://data.riksdagen.se/webbtv/`
- **Omröstningar** hämtas från: `https://data.riksdagen.se/voteringlista/`
- **Personbilder** hämtas från: `https://data.riksdagen.se/filarkiv/bilder/ledamot/{id}_max.jpg`

### AI-sammanfattningar
Appen använder Claude (claude-sonnet-4-20250514) för att generera:
- Ingress för varje debatt (2-3 meningar)
- Blocksummeringar (vänster/höger)
- Förklaring av vad JA/NEJ innebar i omröstningar
- "Vad händer nu?" för varje omröstningsresultat

### CORS-proxy
Vite-servern proxar API-anrop lokalt för att undvika CORS-problem. I produktion behöver du en serverside proxy.

## Bildrätt
Foton från riksdagen.se © Sveriges riksdag.  
Bilderna visas oförändrade — endast CSS-storleksändring används (`object-fit: cover`).  
Bilderna beskärs, filtreras eller ändras inte på något annat sätt.

## Bygga för produktion
```bash
npm run build
```
