const mongoose = require('mongoose');
require('dotenv').config();

const Customer = require('../models/customer.model');
const CallDetail = require('../models/callDetail.model');

async function migrateToMultipleProjects() {
  try {
    console.log('🔄 Çoklu proje desteği için migration başlatılıyor...');
    
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB\'ye bağlandı');

    // 1. Customer'ları migrate et
    console.log('\n📊 Customer migration başlatılıyor...');
    
    const customersWithProjectId = await Customer.find({
      projectId: { $exists: true, $ne: null }
    });
    
    console.log(`📊 projectId'si olan Customer sayısı: ${customersWithProjectId.length}`);

    let customerMigrationCount = 0;
    for (const customer of customersWithProjectId) {
      try {
        // projectId'yi projectIds dizisine taşı
        const projectId = customer.projectId;
        
        // projectIds dizisini oluştur (eğer yoksa)
        if (!customer.projectIds) {
          customer.projectIds = [];
        }
        
        // projectId'yi projectIds'e ekle (eğer yoksa)
        if (projectId && !customer.projectIds.includes(projectId)) {
          customer.projectIds.push(projectId);
        }
        
        // Eski projectId alanını kaldır
        customer.projectId = undefined;
        
        await customer.save();
        
        // Eski projectId alanını tamamen kaldır
        await Customer.updateOne(
          { _id: customer._id },
          { $unset: { projectId: 1 } }
        );
        
        customerMigrationCount++;
        
        console.log(`✅ Customer migrated: ${customer.name} (${customer.phoneNumber})`);
      } catch (error) {
        console.error(`❌ Customer migration error for ${customer._id}:`, error.message);
      }
    }

    console.log(`✅ Customer migration tamamlandı: ${customerMigrationCount}/${customersWithProjectId.length}`);

    // 2. CallDetail'leri migrate et
    console.log('\n📊 CallDetail migration başlatılıyor...');
    
    const callDetailsWithProjectId = await CallDetail.find({
      projectId: { $exists: true, $ne: null }
    });
    
    console.log(`📊 projectId'si olan CallDetail sayısı: ${callDetailsWithProjectId.length}`);

    let callDetailMigrationCount = 0;
    for (const callDetail of callDetailsWithProjectId) {
      try {
        // projectId'yi projectIds dizisine taşı
        const projectId = callDetail.projectId;
        
        // projectIds dizisini oluştur (eğer yoksa)
        if (!callDetail.projectIds) {
          callDetail.projectIds = [];
        }
        
        // projectId'yi projectIds'e ekle (eğer yoksa)
        if (projectId && !callDetail.projectIds.includes(projectId)) {
          callDetail.projectIds.push(projectId);
        }
        
        // Eski projectId alanını kaldır
        callDetail.projectId = undefined;
        
        await callDetail.save();
        
        // Eski projectId alanını tamamen kaldır
        await CallDetail.updateOne(
          { _id: callDetail._id },
          { $unset: { projectId: 1 } }
        );
        
        callDetailMigrationCount++;
        
        console.log(`✅ CallDetail migrated: ${callDetail.callId}`);
      } catch (error) {
        console.error(`❌ CallDetail migration error for ${callDetail._id}:`, error.message);
      }
    }

    console.log(`✅ CallDetail migration tamamlandı: ${callDetailMigrationCount}/${callDetailsWithProjectId.length}`);

    // 3. Son durumu kontrol et
    console.log('\n📊 Migration sonrası durum:');
    
    const finalCustomersWithProjectIds = await Customer.countDocuments({ 
      projectIds: { $exists: true, $ne: [] } 
    });
    const finalCallDetailsWithProjectIds = await CallDetail.countDocuments({ 
      projectIds: { $exists: true, $ne: [] } 
    });
    
    console.log(`✅ projectIds'si olan Customer sayısı: ${finalCustomersWithProjectIds}`);
    console.log(`✅ projectIds'si olan CallDetail sayısı: ${finalCallDetailsWithProjectIds}`);

    // 4. Eski alanları kontrol et
    const remainingCustomersWithProjectId = await Customer.countDocuments({ 
      projectId: { $exists: true } 
    });
    const remainingCallDetailsWithProjectId = await CallDetail.countDocuments({ 
      projectId: { $exists: true } 
    });
    
    console.log(`⚠️  Hala projectId'si olan Customer sayısı: ${remainingCustomersWithProjectId}`);
    console.log(`⚠️  Hala projectId'si olan CallDetail sayısı: ${remainingCallDetailsWithProjectId}`);

    if (remainingCustomersWithProjectId === 0 && remainingCallDetailsWithProjectId === 0) {
      console.log('\n🎉 Migration başarıyla tamamlandı!');
    } else {
      console.log('\n⚠️  Migration tamamlandı ancak bazı kayıtlar hala eski alanı kullanıyor.');
    }

  } catch (error) {
    console.error('❌ Migration hatası:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
  }
}

// Script'i çalıştır
if (require.main === module) {
  migrateToMultipleProjects();
}

module.exports = migrateToMultipleProjects; 