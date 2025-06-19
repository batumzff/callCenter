const mongoose = require('mongoose');
require('dotenv').config();

const CallDetail = require('../models/callDetail.model');

async function testSpecificCallDetail() {
  try {
    console.log('🔍 Belirli CallDetail kaydını test ediyorum...');
    
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB\'ye bağlandı');

    const customerId = '684c2c79ad05e65567ef1637';
    const projectId = '684a813f93ccc4fe069bd8f1';

    console.log(`\n📋 Test parametreleri:`);
    console.log(`   CustomerId: ${customerId}`);
    console.log(`   ProjectId: ${projectId}`);

    // ObjectId'ye çevir
    let convertedCustomerId, convertedProjectId;
    try {
      convertedCustomerId = new mongoose.Types.ObjectId(customerId);
      convertedProjectId = new mongoose.Types.ObjectId(projectId);
      console.log('✅ ObjectId dönüşümü başarılı');
    } catch (error) {
      console.error('❌ ObjectId dönüşüm hatası:', error.message);
      return;
    }

    // Bu customerId'ye sahip CallDetail'leri bul
    const callDetailsByCustomer = await CallDetail.find({ customerId: convertedCustomerId });
    console.log(`\n📊 Bu customerId'ye sahip CallDetail sayısı: ${callDetailsByCustomer.length}`);

    if (callDetailsByCustomer.length > 0) {
      console.log('\n📋 Bu customerId\'ye sahip CallDetail\'ler:');
      callDetailsByCustomer.forEach((cd, index) => {
        console.log(`   ${index + 1}. CallId: ${cd.callId}, ProjectId: ${cd.projectId}, Status: ${cd.callStatus}`);
      });
    }

    // Bu projectId'ye sahip CallDetail'leri bul
    const callDetailsByProject = await CallDetail.find({ projectId: convertedProjectId });
    console.log(`\n📊 Bu projectId'ye sahip CallDetail sayısı: ${callDetailsByProject.length}`);

    if (callDetailsByProject.length > 0) {
      console.log('\n📋 Bu projectId\'ye sahip CallDetail\'ler:');
      callDetailsByProject.forEach((cd, index) => {
        console.log(`   ${index + 1}. CallId: ${cd.callId}, CustomerId: ${cd.customerId}, Status: ${cd.callStatus}`);
      });
    }

    // Her iki koşulu da sağlayan CallDetail'leri bul
    const callDetailsByBoth = await CallDetail.find({ 
      customerId: convertedCustomerId, 
      projectId: convertedProjectId 
    });
    console.log(`\n📊 Her iki koşulu da sağlayan CallDetail sayısı: ${callDetailsByBoth.length}`);

    if (callDetailsByBoth.length > 0) {
      console.log('\n📋 Her iki koşulu da sağlayan CallDetail\'ler:');
      callDetailsByBoth.forEach((cd, index) => {
        console.log(`   ${index + 1}. CallId: ${cd.callId}, Status: ${cd.callStatus}`);
      });
    } else {
      console.log('\n❌ Bu customer ve project kombinasyonu için CallDetail bulunamadı!');
      
      // Tüm CallDetail'lerde bu customerId'nin hangi projectId'lerle eşleştiğini kontrol et
      const allCallDetailsForCustomer = await CallDetail.find({ customerId: convertedCustomerId });
      if (allCallDetailsForCustomer.length > 0) {
        console.log('\n📋 Bu customer\'ın sahip olduğu projectId\'ler:');
        const projectIds = [...new Set(allCallDetailsForCustomer.map(cd => cd.projectId.toString()))];
        projectIds.forEach(pid => {
          console.log(`   - ${pid}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Test hatası:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
  }
}

// Script'i çalıştır
if (require.main === module) {
  testSpecificCallDetail();
}

module.exports = testSpecificCallDetail; 