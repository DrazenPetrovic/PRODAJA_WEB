# Instalacija i pokretanje aplikacije

Ovaj dokument sadrzi sta mora biti instalirano da aplikacija radi stabilno, ukljucujuci direktnu stampu preko lokalnog print servisa.

## 1) Obavezno instalirati

1. Node.js 20 LTS (preporuka: 20.x)
2. npm (dolazi uz Node.js)
3. MySQL Server 8.x
4. .NET 6 Runtime (za lokalni print servis)
5. SumatraPDF (preporuka: default putanja instalacije)

## 2) Preuzimanje zavisnosti projekta

U root folderu projekta pokrenuti:

```bash
npm install
```

Napomena: ovo instalira i biblioteke za print iz preview-a (`html2canvas`, `jspdf`).

## 3) Environment podesavanja

Potrebno je da backend ima pravilno podesen `.env`.
Minimalno proveriti:

1. `FRONTEND_URL` (npr. http://localhost:5175)
2. podatke za MySQL konekciju
3. JWT i ostale server varijable koje vec koristite u projektu

## 4) Lokalni print servis

Za direktnu stampu aplikacija ocekuje servis na:

- `http://127.0.0.1:4567`

Potrebni endpointi:

1. `GET /health`
2. `GET /status`
3. `GET /printers`
4. `POST /print`

`/status` treba da vrati najmanje:

1. `serviceActive`
2. `pdfRendererActive`

Ako su oba `true`, modal salje direktno na servis. Ako nisu, koristi se browser fallback (ako je ukljucen za taj print job).

## 5) Pokretanje aplikacije

Frontend (Vite):

```bash
npm run dev
```

Backend server:

```bash
npm run dev:server
```

## 6) Brza provera sistema

1. Otvoriti aplikaciju i prijaviti se
2. Otvoriti modal za stampu
3. Proveriti da u status kartici pise:
   - Servis aktivan = DA
   - PDF renderer aktivan = DA
4. Kliknuti na dugme za stampu i potvrditi da ne otvara browser print dijalog kada je servis spreman

## 7) Korisne komande

Type check:

```bash
npm run typecheck
```

Build:

```bash
npm run build
```
