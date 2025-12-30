// Debug donations for user
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Donation from './models/donation.model.js';
import User from './models/user.model.js';

dotenv.config();

console.log('🔍 Checking donations in database...');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Find all users
    const users = await User.find({}).select('name email');
    console.log('👥 Users found:', users.length);
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ID: ${user._id}`);
    });
    
    // Find all donations
    const donations = await Donation.find({}).populate('userId', 'name email').populate('campaignId', 'title');
    console.log('\n💰 All donations found:', donations.length);
    
    donations.forEach((donation, i) => {
      console.log(`\nDonation ${i + 1}:`);
      console.log('  - ID:', donation._id);
      console.log('  - User:', donation.userId?.name || 'Unknown', '(' + donation.userId?.email + ')');
      console.log('  - Campaign:', donation.campaignId?.title || 'Unknown');
      console.log('  - Amount:', donation.amount);
      console.log('  - Status:', donation.status);
      console.log('  - Date:', donation.donationDate);
    });
    
    console.log('\n🎉 Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });