# Call Center Backend API

Bu proje, Express.js kullanılarak geliştirilmiş bir backend API'sidir.

## Kurulum

1. Projeyi klonlayın
2. Bağımlılıkları yükleyin:
```bash
npm install
```

## Çalıştırma

Geliştirme modunda çalıştırmak için:
```bash
npm run dev
```

Prodüksiyon modunda çalıştırmak için:
```bash
npm start
```

## API Endpoints

- `GET /`: Ana sayfa
  - Dönen veri: `{ message: "Welcome to Call Center API" }`

## Teknolojiler

- Express.js
- CORS
- Morgan (Logging)
- dotenv (Environment variables) 