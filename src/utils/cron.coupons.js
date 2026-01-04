const cron = require('node-cron');
const Coupon = require('../model/coupon.model');

// Runs every day at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await Coupon.updateMany(
      {
        expiryDate: { $lte: today },
        status: { $ne: 'inactive' }
      },
      {
        $set: { status: 'inactive', expiry: true }
      }
    );
    console.log('Coupon expiry cron ran:', new Date());
  } catch (err) {
    console.error('Coupon expiry cron error:', err);
  }
});

// Manual trigger for testing
async function runCouponExpiryCron() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await Coupon.updateMany(
      {
        expiryDate: { $lte: today },
        status: { $ne: 'inactive' }
      },
      {
        $set: { status: 'inactive', expiry: true }
      }
    );
    console.log('Manual coupon expiry cron ran:', new Date());
  } catch (err) {
    console.error('Manual coupon expiry cron error:', err);
  }
}

module.exports = { runCouponExpiryCron }; 