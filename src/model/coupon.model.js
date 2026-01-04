const { model, Schema } = require('mongoose');

const couponSchema = new Schema({
  // Keep existing fields for backward compatibility
  coupon: { type: String, required: true, unique: true },
  percent: { type: Number, required: true },
  expiryDate: { type: Date, required: true },
  createdDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  expiry: { type: Boolean, default: false },
  
  // New fields for advanced validation
  code: { type: String, required: true, unique: true, uppercase: true },
  discountType: { 
    type: String, 
    enum: ['percentage', 'fixed'], 
    required: true,
    default: 'percentage'
  },
  discountValue: { type: Number, required: true },
  validUntil: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  validPlans: [{ type: String }], // Array of plan IDs
  minAmount: { type: Number, default: 0 },
  maxDiscount: { type: Number }, // Maximum discount for percentage coupons
  usageLimit: { type: Number }, // Per user usage limit
  description: { type: String }
}, { timestamps: true });

// Pre-validate middleware to sync old and new field formats so required validators pass
couponSchema.pre('validate', function(next) {
  // Sync new format with old format for backward compatibility
  if (!this.code && this.coupon) this.code = this.coupon;
  if (this.discountValue == null && this.percent != null) this.discountValue = this.percent;
  if (!this.validUntil && this.expiryDate) this.validUntil = this.expiryDate;
  if (this.isActive == null && this.status) this.isActive = this.status === 'active';
  
  // Sync old format with new format
  if (!this.coupon && this.code) this.coupon = this.code;
  if (this.percent == null && this.discountValue != null) this.percent = this.discountValue;
  if (!this.expiryDate && this.validUntil) this.expiryDate = this.validUntil;
  if (!this.status && this.isActive != null) this.status = this.isActive ? 'active' : 'inactive';
  
  next();
});

module.exports = model('Coupon', couponSchema); 