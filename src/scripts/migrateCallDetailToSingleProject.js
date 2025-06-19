const mongoose = require('mongoose');
require('dotenv').config();

const CallDetail = require('../models/callDetail.model');

async function migrateCallDetailToSingleProject() {
  try {
    console.log('🔄 CallDetail tekil proje desteği için migration başlatılıyor...');
    
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB\'ye bağlandı');

    // projectIds dizisi olan CallDetail'leri bul
    console.log('\n📊 CallDetail migration başlatılıyor...');
    
    const callDetailsWithProjectIds = await CallDetail.find({
      projectIds: { $exists: true, $ne: [] }
    });
    
    console.log(`📊 projectIds dizisi olan CallDetail sayısı: ${callDetailsWithProjectIds.length}`);

    let migrationCount = 0;
    let errorCount = 0;

    for (const callDetail of callDetailsWithProjectIds) {
      try {
        // İlk projectId'yi al (eğer birden fazla varsa)
        const projectId = callDetail.projectIds && callDetail.projectIds.length > 0 
          ? callDetail.projectIds[0] 
          : null;

        if (projectId) {
          // projectId alanını güncelle
          callDetail.projectId = projectId;
          
          // Eski projectIds dizisini kaldır
          callDetail.projectIds = undefined;
          
          await callDetail.save();
          
          // Eski projectIds alanını tamamen kaldır
          await CallDetail.updateOne(
            { _id: callDetail._id },
            { $unset: { projectIds: 1 } }
          );
          
          migrationCount++;
          console.log(`✅ CallDetail migrated: ${callDetail.callId} -> ProjectId: ${projectId}`);
        } else {
          console.log(`⚠️  CallDetail skipped (no projectIds): ${callDetail.callId}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ CallDetail migration error for ${callDetail._id}:`, error.message);
      }
    }

    console.log(`✅ CallDetail migration tamamlandı: ${migrationCount}/${callDetailsWithProjectIds.length}`);
    console.log(`❌ Hata sayısı: ${errorCount}`);

    // Son durumu kontrol et
    console.log('\n📊 Migration sonrası durum:');
    
    const finalCallDetailsWithProjectId = await CallDetail.countDocuments({ 
      projectId: { $exists: true, $ne: null } 
    });
    const remainingCallDetailsWithProjectIds = await CallDetail.countDocuments({ 
      projectIds: { $exists: true } 
    });
    
    console.log(`✅ projectId'si olan CallDetail sayısı: ${finalCallDetailsWithProjectId}`);
    console.log(`⚠️  Hala projectIds'si olan CallDetail sayısı: ${remainingCallDetailsWithProjectIds}`);

    if (remainingCallDetailsWithProjectIds === 0) {
      console.log('\n🎉 CallDetail migration başarıyla tamamlandı!');
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
  migrateCallDetailToSingleProject();
}

module.exports = migrateCallDetailToSingleProject; 