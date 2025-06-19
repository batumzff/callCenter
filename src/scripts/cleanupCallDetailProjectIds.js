const mongoose = require('mongoose');
require('dotenv').config();

const CallDetail = require('../models/callDetail.model');

async function cleanupCallDetailProjectIds() {
  try {
    console.log('🧹 CallDetail projectIds temizliği başlatılıyor...');
    
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB\'ye bağlandı');

    // projectIds alanı olan CallDetail'leri bul
    const callDetailsWithProjectIds = await CallDetail.find({
      projectIds: { $exists: true }
    });
    
    console.log(`📊 projectIds alanı olan CallDetail sayısı: ${callDetailsWithProjectIds.length}`);

    if (callDetailsWithProjectIds.length > 0) {
      // Tüm CallDetail'lerden projectIds alanını kaldır
      const result = await CallDetail.updateMany(
        { projectIds: { $exists: true } },
        { $unset: { projectIds: 1 } }
      );
      
      console.log(`✅ Temizlik tamamlandı: ${result.modifiedCount} kayıt güncellendi`);
    } else {
      console.log('✅ Temizlik gerekli değil - projectIds alanı yok');
    }

    // Son durumu kontrol et
    console.log('\n📊 Temizlik sonrası durum:');
    
    const finalCallDetailsWithProjectId = await CallDetail.countDocuments({ 
      projectId: { $exists: true, $ne: null } 
    });
    const remainingCallDetailsWithProjectIds = await CallDetail.countDocuments({ 
      projectIds: { $exists: true } 
    });
    
    console.log(`✅ projectId'si olan CallDetail sayısı: ${finalCallDetailsWithProjectId}`);
    console.log(`⚠️  Hala projectIds'si olan CallDetail sayısı: ${remainingCallDetailsWithProjectIds}`);

    if (remainingCallDetailsWithProjectIds === 0) {
      console.log('\n🎉 Temizlik başarıyla tamamlandı!');
    } else {
      console.log('\n⚠️  Temizlik tamamlandı ancak bazı kayıtlar hala eski alanı kullanıyor.');
    }

  } catch (error) {
    console.error('❌ Temizlik hatası:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
  }
}

// Script'i çalıştır
if (require.main === module) {
  cleanupCallDetailProjectIds();
}

module.exports = cleanupCallDetailProjectIds; 