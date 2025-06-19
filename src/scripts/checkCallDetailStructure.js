const mongoose = require('mongoose');
require('dotenv').config();

const CallDetail = require('../models/callDetail.model');

async function checkCallDetailStructure() {
  try {
    console.log('🔍 CallDetail yapısını kontrol ediyorum...');
    
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB\'ye bağlandı');

    // Tüm CallDetail'leri getir
    const allCallDetails = await CallDetail.find().limit(5);
    
    console.log(`📊 Toplam CallDetail sayısı: ${await CallDetail.countDocuments()}`);
    console.log(`📊 Örnek CallDetail sayısı: ${allCallDetails.length}`);

    // Her CallDetail'in yapısını kontrol et
    allCallDetails.forEach((callDetail, index) => {
      console.log(`\n📋 CallDetail ${index + 1}:`);
      console.log(`   ID: ${callDetail._id}`);
      console.log(`   CallId: ${callDetail.callId}`);
      console.log(`   CustomerId: ${callDetail.customerId}`);
      console.log(`   ProjectId: ${callDetail.projectId || 'YOK'}`);
      console.log(`   ProjectIds: ${callDetail.projectIds ? JSON.stringify(callDetail.projectIds) : 'YOK'}`);
      console.log(`   Status: ${callDetail.callStatus}`);
      console.log(`   Raw object keys: ${Object.keys(callDetail.toObject())}`);
    });

    // Alan varlığını kontrol et
    const withProjectId = await CallDetail.countDocuments({ projectId: { $exists: true } });
    const withProjectIds = await CallDetail.countDocuments({ projectIds: { $exists: true } });
    
    console.log(`\n📊 Alan varlığı:`);
    console.log(`   projectId alanı olan: ${withProjectId}`);
    console.log(`   projectIds alanı olan: ${withProjectIds}`);

    // Örnek bir CallDetail'in raw verisini göster
    if (allCallDetails.length > 0) {
      console.log(`\n📋 Örnek CallDetail raw verisi:`);
      console.log(JSON.stringify(allCallDetails[0].toObject(), null, 2));
    }

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
  }
}

// Script'i çalıştır
if (require.main === module) {
  checkCallDetailStructure();
}

module.exports = checkCallDetailStructure; 