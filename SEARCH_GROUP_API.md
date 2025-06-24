# Arama Grubu (Search Group) API Dokümantasyonu

## Genel Bakış

Arama Grubu sistemi, müşterileri, projeleri ve akışları organize etmek için kullanılan bir yapıdır. Bu sistem sayesinde:

- Müşterileri gruplar halinde yönetebilirsiniz
- Projeleri arama gruplarına atayabilirsiniz
- Akışları (flows) oluşturabilir ve yönetebilirsiniz
- Dışarıdan yeni müşteriler ekleyebilirsiniz
- Toplu müşteri ekleme yapabilirsiniz

## Model Yapısı

### SearchGroup Model
```javascript
{
  name: String (required),
  description: String,
  status: ['active', 'completed', 'archived', 'paused'],
  createdBy: ObjectId (User),
  customers: [ObjectId (Customer)],
  projects: [ObjectId (Project)],
  flows: [{
    name: String,
    description: String,
    status: ['active', 'inactive', 'completed'],
    createdAt: Date
  }],
  settings: {
    maxCustomers: Number (default: 1000),
    autoAssignProjects: Boolean (default: false),
    notificationEnabled: Boolean (default: true)
  }
}
```

## API Endpoint'leri

### 1. Arama Grubu CRUD İşlemleri

#### Tüm Arama Gruplarını Getir
```
GET /api/search-groups
Authorization: Bearer <token>
```

#### Yeni Arama Grubu Oluştur
```
POST /api/search-groups
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Arama Grubu Adı",
  "description": "Açıklama",
  "settings": {
    "maxCustomers": 500,
    "autoAssignProjects": true,
    "notificationEnabled": true
  }
}
```

#### Arama Grubu Detaylarını Getir
```
GET /api/search-groups/:id
Authorization: Bearer <token>
```

#### Arama Grubunu Güncelle
```
PUT /api/search-groups/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Yeni Ad",
  "description": "Yeni Açıklama",
  "status": "active",
  "settings": {
    "maxCustomers": 1000
  }
}
```

#### Arama Grubunu Sil
```
DELETE /api/search-groups/:id
Authorization: Bearer <token>
```

### 2. Müşteri Yönetimi

#### Mevcut Müşteriyi Arama Grubuna Ekle
```
POST /api/search-groups/:id/customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "customerId": "customer_object_id"
}
```

#### Arama Grubundan Müşteri Çıkar
```
DELETE /api/search-groups/:id/customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "customerId": "customer_object_id"
}
```

#### Dışarıdan Yeni Müşteri Ekle
```
POST /api/search-groups/:id/external-customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Müşteri Adı",
  "phoneNumber": "5551234567",
  "note": "Not",
  "record": "Kayıt"
}
```

#### Toplu Müşteri Ekleme
```
POST /api/search-groups/:id/bulk-customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "customers": [
    {
      "name": "Müşteri 1",
      "phoneNumber": "5551234567",
      "note": "Not 1",
      "record": "Kayıt 1"
    },
    {
      "name": "Müşteri 2",
      "phoneNumber": "5551234568",
      "note": "Not 2",
      "record": "Kayıt 2"
    }
  ]
}
```

### 3. Proje Yönetimi

#### Projeyi Arama Grubuna Ekle
```
POST /api/search-groups/:id/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "projectId": "project_object_id"
}
```

#### Arama Grubundan Proje Çıkar
```
DELETE /api/search-groups/:id/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "projectId": "project_object_id"
}
```

### 4. Akış (Flow) Yönetimi

#### Arama Grubuna Akış Ekle
```
POST /api/search-groups/:id/flows
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Akış Adı",
  "description": "Akış Açıklaması"
}
```

#### Akışı Güncelle
```
PUT /api/search-groups/:id/flows/:flowId
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Yeni Akış Adı",
  "description": "Yeni Açıklama",
  "status": "active"
}
```

#### Akışı Sil
```
DELETE /api/search-groups/:id/flows/:flowId
Authorization: Bearer <token>
```

### 5. İstatistikler ve Raporlar

#### Arama Grubu İstatistikleri
```
GET /api/search-groups/:id/stats
Authorization: Bearer <token>
```

#### Arama Grubu Call Detayları
```
GET /api/search-groups/:id/call-details
Authorization: Bearer <token>
```

## Özellikler

### 1. Otomatik İlişki Yönetimi
- Müşteri arama grubuna eklendiğinde, müşteri modelindeki `searchGroupIds` alanı otomatik güncellenir
- Proje arama grubuna eklendiğinde, proje modelindeki `searchGroupIds` alanı otomatik güncellenir
- İlişkiler çift yönlü olarak yönetilir

### 2. Dışarıdan Müşteri Ekleme
- Mevcut müşteri yoksa yeni müşteri oluşturulur
- Mevcut müşteri varsa bilgileri güncellenir
- Telefon numarası benzersizlik kontrolü yapılır

### 3. Toplu İşlemler
- Birden fazla müşteriyi tek seferde ekleyebilirsiniz
- Hata durumunda detaylı rapor alırsınız
- Başarılı ve başarısız işlemler ayrı ayrı raporlanır

### 4. Limit Kontrolleri
- Maksimum müşteri sayısı kontrolü
- Ayarlanabilir limitler
- Dinamik limit yönetimi

### 5. Virtual Fields
- `customerCount`: Müşteri sayısı
- `projectCount`: Proje sayısı
- `flowCount`: Akış sayısı

## Kullanım Örnekleri

### 1. Yeni Arama Grubu Oluşturma
```javascript
const response = await fetch('/api/search-groups', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    name: 'Yeni Müşteri Grubu',
    description: 'Bu grup yeni müşteriler için oluşturuldu',
    settings: {
      maxCustomers: 500,
      autoAssignProjects: true
    }
  })
});
```

### 2. Dışarıdan Müşteri Ekleme
```javascript
const response = await fetch('/api/search-groups/groupId/external-customers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    name: 'Ahmet Yılmaz',
    phoneNumber: '5551234567',
    note: 'Potansiyel müşteri',
    record: 'İlk görüşme yapıldı'
  })
});
```

### 3. Akış Ekleme
```javascript
const response = await fetch('/api/search-groups/groupId/flows', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    name: 'Satış Akışı',
    description: 'Yeni müşteriler için satış süreci'
  })
});
```

## Hata Kodları

- `400`: Geçersiz istek (validation hatası, limit aşımı, vb.)
- `401`: Yetkilendirme hatası
- `404`: Kaynak bulunamadı
- `500`: Sunucu hatası

## Notlar

- Tüm endpoint'ler authentication gerektirir
- Müşteri telefon numaraları benzersiz olmalıdır
- Arama grupları kullanıcıya özeldir (createdBy kontrolü)
- İlişkiler otomatik olarak yönetilir
- Virtual field'lar JSON response'da otomatik dahil edilir 