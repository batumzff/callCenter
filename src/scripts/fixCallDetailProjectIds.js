const mongoose = require('mongoose');
require('dotenv').config();

const CallDetail = require('../models/callDetail.model');

async function fixCallDetailProjectIds() {
  try {
    console.log('🔧 CallDetail projectId\'lerini düzeltiyorum...');
    
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB\'ye bağlandı');

    const customerId = '684c2c79ad05e65567ef1637';
    const correctProjectId = '684a813f93ccc4fe069bd8f1';
    const wrongProjectId = '684c2c79ad05e65567ef1637';

    console.log(`\n📋 Düzeltme parametreleri:`);
    console.log(`   CustomerId: ${customerId}`);
    console.log(`   Yanlış ProjectId: ${wrongProjectId}`);
    console.log(`   Doğru ProjectId: ${correctProjectId}`);

    // ObjectId'ye çevir
    let convertedCustomerId, convertedCorrectProjectId, convertedWrongProjectId;
    try {
      convertedCustomerId = new mongoose.Types.ObjectId(customerId);
      convertedCorrectProjectId = new mongoose.Types.ObjectId(correctProjectId);
      convertedWrongProjectId = new mongoose.Types.ObjectId(wrongProjectId);
      console.log('✅ ObjectId dönüşümü başarılı');
    } catch (error) {
      console.error('❌ ObjectId dönüşüm hatası:', error.message);
      return;
    }

    // Bu customer'ın yanlış projectId'ye sahip CallDetail'lerini bul
    const callDetailsToFix = await CallDetail.find({ 
      customerId: convertedCustomerId,
      projectId: convertedWrongProjectId
    });
    
    console.log(`\n📊 Düzeltilecek CallDetail sayısı: ${callDetailsToFix.length}`);

    if (callDetailsToFix.length > 0) {
      console.log('\n📋 Düzeltilecek CallDetail\'ler:');
      callDetailsToFix.forEach((cd, index) => {
        console.log(`   ${index + 1}. CallId: ${cd.callId}, Status: ${cd.callStatus}`);
      });

      // CallDetail'leri güncelle
      const result = await CallDetail.updateMany(
        { 
          customerId: convertedCustomerId,
          projectId: convertedWrongProjectId
        },
        { 
          projectId: convertedCorrectProjectId 
        }
      );
      
      console.log(`\n✅ Güncelleme tamamlandı: ${result.modifiedCount} kayıt güncellendi`);

      // Güncelleme sonrası kontrol
      const updatedCallDetails = await CallDetail.find({ 
        customerId: convertedCustomerId,
        projectId: convertedCorrectProjectId
      });
      
      console.log(`\n📊 Güncelleme sonrası doğru projectId'ye sahip CallDetail sayısı: ${updatedCallDetails.length}`);
    } else {
      console.log('\n✅ Düzeltilecek CallDetail bulunamadı');
    }

  } catch (error) {
    console.error('❌ Düzeltme hatası:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
  }
}

// Script'i çalıştır
if (require.main === module) {
  fixCallDetailProjectIds();
}

module.exports = fixCallDetailProjectIds; 