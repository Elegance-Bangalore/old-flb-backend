const Razorpay = require("razorpay");
const crypto = require("crypto");
const ordersModel = require("./../model/order.model");
const mongoose = require("mongoose");
const sellerSubModel = require("../model/sellerSub.model");
const { planIds, subscription } = require("../config/subscription");
const moment = require("moment");
const sellerModel = require("../model/seller.model");
const axios = require("axios");

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


console.log('Using Razorpay Key:', process.env.RAZORPAY_KEY_ID);

// exports.checkout = async (req, res) => {
//   try {
//     const { _id, email } = req.user;
//     const planName = req.body.plan;
//     let planId = planIds.filter((plan) => plan.plan === planName);
//     let Id;
//     if (planId.length) {
//       Id = planId[0].id;
//     }

//     let planDetails = subscription.filter((plan) => plan.planName === planName);

//     let timePeriod;
//     if (planDetails.length) {
//       timePeriod = Number(planDetails[0].timePeriod);
//     }

//     let expiresAt = moment(new Date())
//       .add(timePeriod, "months")
//       .toDate()
//       .getTime();

//     let expiry = moment(new Date())
//       .add(timePeriod, "months")
//       .format("DD-MM-YYYY");

//     const dataToUpdate = {
//       id: _id.toString(),
//       plan: planName,
//       expiresAt: expiry,
//       email: email,
//     };

//     const params = {
//       plan_id: Id,
//       total_count: timePeriod,
//       quantity: 1,
//       customer_notify: 1,
//       expire_by: expiresAt,
//       notes: {
//         subscription: `${planName} subscription - ${timePeriod}`,
//       },
//     };

//     const response = await razorpayInstance.subscriptions.create(params);

//     if (response && Object.keys(response).length) {
//       // store the subscription id w.r.t to the seller in DB
//       await sellerModel.findOneAndUpdate(
//         { _id: new mongoose.Types.ObjectId(_id) },
//         { $set: { subscriptionId: response.id } }
//       );
//       await sellerSubModel.findOneAndUpdate(
//         { id: new mongoose.Types.ObjectId(_id) },
//         { $set: { ...dataToUpdate } },
//         { upsert: true }
//       );
//     }
//     res.status(200).json({
//       success: true,
//       data: response,
//     });
//   } catch (err) {
//     console.log(err); 
//     return res.status(500).send({ status: 500, message: err.error });
//   }
// };


exports.checkout = async (req, res) => {
  console.log(req,"req...............")
  console.log(req.body,"body...............")
  try {
    // Validate Razorpay credentials
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Payment gateway configuration error.",
      });
    }


    const { _id, email } = req.user;
    const { plan: planName, timePeriod } = req.body;

    if (!timePeriod) {
      return res.status(400).json({
        success: false,
        message: "Missing time period.",
      });
    }

    // Find the correct plan ID based on planName and timePeriod
    const planIdObj = planIds.find(
      (plan) => plan.plan === planName && plan.timePeriod === timePeriod
    );

    if (!planIdObj) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan or time period.",
      });
    }

    const Id = planIdObj.id;
    const Price = planIdObj.price;

    // Validate plan ID
    if (!Id || Id.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Invalid plan ID. Please contact support.",
      });
    }

    // Check if plan ID follows Razorpay format
    if (!Id.startsWith('plan_')) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan ID format. Please contact support.",
      });
    }

    // Convert timePeriod to integer for Razorpay
    const timePeriodInt = parseInt(timePeriod);
    
    let expiresAt = moment(new Date())
      .add(timePeriodInt, "months")
      .toDate()
      .getTime();

    let expiry = moment(new Date())
      .add(timePeriodInt, "months")
      .format("DD-MM-YYYY");

    // Coupon/discount support
    const { couponCode, discountAmount, finalAmount, offerId, amount, couponDiscount, couponType } = req.body;
    const baseAmountNumber = Number.isFinite(Number(amount)) && Number(amount) > 0 ? Number(amount) : Number(Price);
    const explicitFinalAmountNumber = Number.isFinite(Number(finalAmount)) && Number(finalAmount) >= 0 ? Number(finalAmount) : null;
    const numericDiscountAmount = Number.isFinite(Number(discountAmount)) && Number(discountAmount) > 0 ? Number(discountAmount) : null;
    const numericCouponDiscountRaw = Number.isFinite(Number(couponDiscount)) && Number(couponDiscount) > 0 ? Number(couponDiscount) : null;

    let computedDiscount = 0;
    let appliedCouponPercent = null;

    if (explicitFinalAmountNumber !== null) {
      computedDiscount = Math.max(0, baseAmountNumber - explicitFinalAmountNumber);
    } else if (numericDiscountAmount !== null) {
      // explicit flat discount provided
      computedDiscount = Math.min(baseAmountNumber, numericDiscountAmount);
    } else if (numericCouponDiscountRaw !== null) {
      if (couponType === 'percentage') {
        // Clamp percent between 0 and 100
        appliedCouponPercent = Math.max(0, Math.min(100, numericCouponDiscountRaw));
        computedDiscount = Math.floor((baseAmountNumber * appliedCouponPercent) / 100);
      } else {
        // Flat discount cannot exceed base amount
        computedDiscount = Math.min(baseAmountNumber, numericCouponDiscountRaw);
      }
    }

    if (!Number.isFinite(computedDiscount) || computedDiscount < 0) computedDiscount = 0;
    const computedFinalAmountNumber = explicitFinalAmountNumber !== null
      ? explicitFinalAmountNumber
      : Math.max(0, baseAmountNumber - computedDiscount);
    const hasValidDiscount = computedDiscount > 0;
    const discountedPrice = String(computedFinalAmountNumber);

    const dataToUpdate = {
      id: _id.toString(),
      plan: planName,
      planId: Id,
      timePeriod: timePeriod,
      price: discountedPrice,
      expiresAt: expiry,
      email: email,
    };

    const params = {
      plan_id: Id,
      total_count: timePeriodInt, // Use integer
      quantity: 1,
      customer_notify: 1,
      expire_by: expiresAt, // This should be a valid timestamp
      notes: {
        subscription: `${planName} subscription - ${timePeriod} months`,
        couponCode: couponCode || undefined,
        couponType: couponType || undefined,
        couponDiscount: couponType === 'percentage' && appliedCouponPercent !== null
          ? String(appliedCouponPercent)
          : (couponType !== 'percentage' && numericCouponDiscountRaw !== null ? String(numericCouponDiscountRaw) : undefined),
        discountAmount: hasValidDiscount ? String(computedDiscount) : undefined,
        originalAmount: String(baseAmountNumber),
        finalAmount: String(computedFinalAmountNumber),
      },
    };

    // If a Razorpay Offer is configured for this coupon, pass it to apply discount at gateway
    if (offerId && typeof offerId === 'string' && offerId.startsWith('offer_')) {
      params.offer_id = offerId;
    }

    console.log('Razorpay params:', params); // Debug log

    if (!Id) {
      console.error('Missing plan_id for Razorpay subscription creation!');
      return res.status(400).json({ error: 'Missing plan_id' });
    }
    console.log('Creating Razorpay subscription with:', params);
    const response = await razorpayInstance.subscriptions.create(params);

    if (response && Object.keys(response).length) {
      // Store the subscription ID with respect to the seller in DB
      await sellerModel.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(_id) },
        { $set: { subscriptionId: response.id } }
      );
      await sellerSubModel.findOneAndUpdate(
        { id: new mongoose.Types.ObjectId(_id) },
        { $set: { ...dataToUpdate } },
        { upsert: true }
      );
    }

    const finalAmountPaise = Math.round(computedFinalAmountNumber * 100);

    res.status(200).json({
      success: true,
      data: Object.assign({}, response, {
        display_amount: String(computedFinalAmountNumber),
        display_amount_in_paise: String(finalAmountPaise)
      }),
      discountedAmount: String(computedFinalAmountNumber),
      pricing: {
        plan: planName,
        timePeriod: String(timePeriod),
        originalAmount: String(baseAmountNumber),
        discountAmount: hasValidDiscount ? String(computedDiscount) : "0",
        finalAmount: String(computedFinalAmountNumber),
        couponCode: couponCode || undefined,
        couponType: couponType || undefined,
        couponDiscount: couponType === 'percentage' && appliedCouponPercent !== null
          ? String(appliedCouponPercent)
          : (couponType !== 'percentage' && numericCouponDiscountRaw !== null ? String(numericCouponDiscountRaw) : undefined),
        offerId: offerId || undefined
      }
    });
  } catch (err) {
    console.log('Razorpay error details:', {
      message: err.message,
      error: err.error,
      description: err.error?.description,
      code: err.error?.code,
      step: err.error?.step,
      reason: err.error?.reason,
      source: err.error?.source
    });
    
    // Return more specific error message
    if (err.error?.description) {
      return res.status(400).send({ 
        status: 400, 
        message: `Payment Error: ${err.error.description}`,
        error: err.error 
      });
    }
    
    return res.status(500).send({ status: 500, message: err.message });
  }
};

// One-time payment checkout
// exports.createOrder = async (req, res) => {
//   console.log(req.body,"create order...............")
//   try {
//     // Validate Razorpay credentials
//     if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
//       return res.status(500).json({
//         success: false,
//         message: "Payment gateway configuration error.",
//       });
//     }

//     const { _id, email } = req.user;
//     const { amount, currency = 'INR', planName } = req.body;

//     // Validate required fields
//     if (!amount || amount <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid amount. Amount must be greater than 0.",
//       });
//     }

//     // Convert amount to paise (Razorpay expects amount in smallest currency unit)
//     const amountInPaise = Math.round(amount * 100);

//     const options = {
//       amount: amountInPaise,
//       currency: currency,
//       receipt: `rcpt_${Date.now()}`, // Shortened receipt format
//       notes: {
//         userId: _id.toString(),
//         email: email,
//         planName: planName || 'One-time payment',
//         paymentType: 'one-time'
//       }
//     };

//     console.log('Creating Razorpay order with options:', options);

//     const order = await razorpayInstance.orders.create(options);

//     if (order && order.id) {
//       // Store order details in database (optional)
//       await ordersModel.create({
//         userId: _id,
//         razorpay_order_id: order.id,
//         amount: amount,
//         currency: currency,
//         status: 'created',
//         planName: planName || 'One-time payment'
//       });

//       res.status(200).json({
//         success: true,
//         data: {
//           orderId: order.id,
//           amount: amount,
//           currency: currency,
//           key: process.env.RAZORPAY_KEY_ID
//         }
//       });
//     } else {
//       res.status(500).json({
//         success: false,
//         message: "Failed to create order"
//       });
//     }
//   } catch (err) {
//     console.log('Create order error:', {
//       message: err.message,
//       error: err.error,
//       description: err.error?.description,
//       code: err.error?.code
//     });
    
//     if (err.error?.description) {
//       return res.status(400).json({ 
//         success: false,
//         message: `Order creation failed: ${err.error.description}`,
//         error: err.error 
//       });
//     }
    
//     return res.status(500).json({ 
//       success: false, 
//       message: err.message || "Order creation failed"
//     });
//   }
// };


// ... existing code ...
exports.createOrder = async (req, res) => {
  console.log(req.body,"create order...............")
  try {
    // Validate Razorpay credentials
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Payment gateway configuration error.",
      });
    }

    const { _id, email } = req.user;
    const { amount, currency = 'INR', timePeriod } = req.body;
    const planName = req.body.planName || req.body.plan;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount. Amount must be greater than 0.",
      });
    }

    // Convert amount to paise (Razorpay expects amount in smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    const options = {
      amount: amountInPaise,
      currency: currency,
      receipt: `rcpt_${Date.now().toString().slice(-10)}`, // Shortened receipt format
      notes: {
        userId: _id.toString(),
        email: email,
        planName: planName || 'One-time payment',
        timePeriod: timePeriod ? String(timePeriod) : undefined,
        paymentType: 'one-time'
      }
    };

    console.log('Creating Razorpay order with options:', options);

    const order = await razorpayInstance.orders.create(options);

    if (order && order.id) {
      // Store order details in database (optional)
      await ordersModel.create({
        userId: _id,
        razorpay_order_id: order.id,
        amount: amount,
        currency: currency,
        status: 'created',
        planName: planName || 'One-time payment',
        timePeriod: timePeriod ? String(timePeriod) : undefined
      });

      // Return data in the same format as checkout for frontend compatibility
      res.status(200).json({
        success: true,
        data: {
          id: order.id, // This is the order ID that frontend will use
          amount: amountInPaise, // Amount in paise for Razorpay
          currency: currency,
          receipt: order.receipt,
          status: order.status,
          created_at: order.created_at,
          // Additional fields for frontend
          orderId: order.id,
          key: process.env.RAZORPAY_KEY_ID,
          paymentType: 'one-time',
          planName: planName || 'One-time payment',
          timePeriod: timePeriod ? String(timePeriod) : undefined
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to create order"
      });
    }
  } catch (err) {
    console.log('Create order error:', {
      message: err.message,
      error: err.error,
      description: err.error?.description,
      code: err.error?.code
    });
    
    if (err.error?.description) {
      return res.status(400).json({ 
        success: false,
        message: `Order creation failed: ${err.error.description}`,
        error: err.error 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: err.message || "Order creation failed"
    });
  }
};
// ... existing code ...


// exports.paymentVerification = async (req, res) => {
//   try {
//     const _id = req.query._id;

//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
//       req.body;

//     const body = razorpay_order_id + "|" + razorpay_payment_id;

//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(body.toString())
//       .digest("hex");

//     console.log(expectedSignature,"expectedSignature")
//     console.log(razorpay_signature,"razorpay_signature")

//     const isAuthentic = expectedSignature === razorpay_signature;
//     console.log("before if ",isAuthentic)

//     if (isAuthentic) {
//       console.log("enter in if ")
//       await ordersModel.create({
//         userId: _id,
//         razorpay_order_id: razorpay_order_id,
//         razorpay_payment_id: razorpay_payment_id,
//         razorpay_signature: razorpay_signature,
//       });
//       await sellerModel.findOneAndUpdate(
//         { _id: new mongoose.Types.ObjectId(_id) },
//         { $set: { subscription: true } },
//         { upsert: true }
//       );
//       await sellerSubModel.findOneAndUpdate(
//         { id: new mongoose.Types.ObjectId(_id) },
//         { $set: { isActive: true } }
//       );

//       // res.redirect(
//       //   `http://localhost:5500/paymentsuccess?reference=${razorpay_payment_id}`
//       // );
//       res.status(200).json({
//         success: true,
//         referenceId: razorpay_payment_id,
//       });
//     } else {
//       res.status(400).json({
//         success: false,
//       });
//     }
//   } catch (err) {
//     console.log('paymentVerification error:', err); // Log the error for debugging
//     return res.status(500).send({ status: 500, message: err.message });
//   }
// };

// Upgrade Subscription Plan


// Backend payment verification function


exports.paymentVerification = async (req, res) => {
  console.log("enter in verification code....")
  try {
    const _id = req.query._id;

    // Check if this is a subscription payment or one-time payment
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      razorpay_subscription_id,  // Add this for subscription payments
      planName, // optional context for one-time
      timePeriod, // optional context for one-time
      price // optional context for one-time
    } = req.body;

    let body;
    let isSubscriptionPayment = false;

    // Determine if this is a subscription payment
    if (razorpay_subscription_id) {
      // For subscription payments, the body format is different
      body = razorpay_payment_id + "|" + razorpay_subscription_id;
      isSubscriptionPayment = true;
      console.log("Processing subscription payment verification");
    } else if (razorpay_order_id) {
      // For one-time payments
      body = razorpay_order_id + "|" + razorpay_payment_id;
      console.log("Processing one-time payment verification");
    } else {
      return res.status(400).json({
        success: false,
        message: "Missing required payment parameters"
      });
    }

    console.log("Body for signature:", body);

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    console.log("Expected signature:", expectedSignature);
    console.log("Received signature:", razorpay_signature);

    const isAuthentic = expectedSignature === razorpay_signature;
    console.log("Signature verification result:", isAuthentic);

    if (isAuthentic) {
      console.log("Signature verified successfully");
      
      // Create order record with appropriate fields
      const orderData = {
        userId: _id,
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
      };

      // Add subscription or order ID based on payment type
      if (isSubscriptionPayment) {
        orderData.razorpay_subscription_id = razorpay_subscription_id;
      } else {
        orderData.razorpay_order_id = razorpay_order_id;
      }

      await ordersModel.create(orderData);
      
      // Update seller subscription status
      await sellerModel.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(_id) },
        { $set: { subscription: true } },
        { upsert: true }
      );
      
      // For one-time payments, also upsert full subscription info
      if (!isSubscriptionPayment) {
        let resolvedPlanName = planName;
        let resolvedTimePeriod = timePeriod;
        let resolvedPrice = price;

        // If not provided in body, try to fetch from Razorpay order notes
        if ((!resolvedPlanName || !resolvedTimePeriod) && razorpay_order_id) {
          try {
            const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);
            if (orderInfo && orderInfo.notes) {
              resolvedPlanName = resolvedPlanName || orderInfo.notes.planName;
              resolvedTimePeriod = resolvedTimePeriod || orderInfo.notes.timePeriod;
            }
          } catch (e) {
            console.warn('Failed to fetch order details from Razorpay:', e?.message || e);
          }
        }

        // If still missing, try local DB order
        if ((!resolvedPlanName || !resolvedTimePeriod) && razorpay_order_id) {
          try {
            const localOrder = await ordersModel.findOne({ razorpay_order_id });
            if (localOrder) {
              resolvedPlanName = resolvedPlanName || localOrder.planName;
              resolvedTimePeriod = resolvedTimePeriod || localOrder.timePeriod;
              resolvedPrice = resolvedPrice || localOrder.amount;
            }
          } catch (e) {
            console.warn('Failed to fetch local order for context:', e?.message || e);
          }
        }

        const months = parseInt(resolvedTimePeriod || '1', 10);
        let expiryFormatted = null;
        if (!isNaN(months) && months > 0) {
          const expiry = moment(new Date())
            .add(months, "months")
            .format("DD-MM-YYYY");
          expiryFormatted = expiry;
        }

        const dataToUpdate = {
          plan: resolvedPlanName || 'One-time',
          planId: 'one-time',
          timePeriod: resolvedTimePeriod ? String(resolvedTimePeriod) : undefined,
          price: resolvedPrice ? String(resolvedPrice) : undefined,
          expiresAt: expiryFormatted || undefined,
          email: undefined,
          isActive: true
        };

        // Clean undefined keys
        Object.keys(dataToUpdate).forEach((k) => dataToUpdate[k] === undefined && delete dataToUpdate[k]);

        await sellerSubModel.findOneAndUpdate(
          { id: new mongoose.Types.ObjectId(_id) },
          { $set: { id: _id.toString(), ...dataToUpdate } },
          { upsert: true }
        );
      } else {
        // Ensure active flag on subscription success as before
        await sellerSubModel.findOneAndUpdate(
          { id: new mongoose.Types.ObjectId(_id) },
          { $set: { isActive: true } }
        );
      }

      res.status(200).json({
        success: true,
        referenceId: razorpay_payment_id,
        paymentType: isSubscriptionPayment ? 'subscription' : 'one-time'
      });
    } else {
      console.log("Signature verification failed");
      res.status(400).json({
        success: false,
        message: "Payment verification failed"
      });
    }
  } catch (err) {
    console.log('paymentVerification error:', err);
    return res.status(500).send({ 
      status: 500, 
      message: err.message,
      error: "Payment verification failed"
    });
  }
};

// Frontend verification function (React component)
async function verificationPayment(response) {
  try {
    console.log("Verification response:", response);
    
    // Extract necessary data from Razorpay response
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      razorpay_order_id  // Add this for one-time payments
    } = response;

    // Validate required fields based on payment type
    if (!razorpay_payment_id || !razorpay_signature) {
      throw new Error("Missing required payment verification data");
    }

    // Check if we have subscription_id or order_id
    if (!razorpay_subscription_id && !razorpay_order_id) {
      throw new Error("Missing subscription_id or order_id");
    }

    // Construct payload for verification API
    const verificationData = {
      razorpay_payment_id: razorpay_payment_id,
      razorpay_signature: razorpay_signature,
    };

    // Add subscription_id or order_id based on what we have
    if (razorpay_subscription_id) {
      verificationData.razorpay_subscription_id = razorpay_subscription_id;
    } else if (razorpay_order_id) {
      verificationData.razorpay_order_id = razorpay_order_id;
    }

    console.log("Sending verification data:", verificationData);

    // Make HTTP POST request to the verification API
    const verificationResponse = await paymentVerificationApi(
      verificationData,
      user?._id
    );
    
    console.log("Verification API response:", verificationResponse);
    
    if (verificationResponse.status === 200) {
      toast.success("Payment verified successfully!");
      await getExistingSubscriptionPlan();
      setPaymentDoneModal(true);
    } else {
      throw new Error("Payment verification failed");
    }
    
  } catch (error) {
    console.error("Verification error:", error);
    
    if (error.response?.data?.message) {
      toast.error("Payment verification failed: " + error.response.data.message);
    } else {
      toast.error("Something went wrong in Payment verification: " + error.message);
    }
    
    setLoader(false);
  }
}



exports.upgradeSubscription = async (req, res) => {
  try {
    const { _id, email } = req.user;

    let newPlan = req.body.plan;
    let totalCount = 6;
    if (newPlan == "Basic" || newPlan == "Silver") {
      totalCount = 3;
    }

    // get the planId
    let planId = planIds.filter((plan) => plan.plan == newPlan);
    let plan_id;
    if (planId) {
      plan_id = planId[0].id;
    }
    const sellerSubId = await sellerModel
      .findOne({ _id: new mongoose.Types.ObjectId(_id) })
      .select({ subscriptionId: 1 })
      .lean();

    let subscriptionId = "";
    if (sellerSubId) {
      subscriptionId = sellerSubId.subscriptionId;
    }
    let params = {};
    let expiresAt = moment(new Date())
      .add(totalCount, "months")
      .toDate()
      .getTime();
    let expiry = moment(new Date())
      .add(totalCount, "months")
      .format("DD-MM-YYYY");
    const cancelOldSubscription = await this.cancel(subscriptionId);
    if (cancelOldSubscription) {
      // create a new subscription
      params = {
        plan_id: plan_id,
        total_count: totalCount,
        quantity: 1,
        customer_notify: 1,
        expire_by: expiresAt,
        notes: {
          subscription: `${newPlan} subscription - ${totalCount}`,
        },
      };

      const dataToUpdate = {
        id: _id.toString(),
        plan: newPlan,
        expiresAt: expiry,
        email: email,
      };

      const response = await razorpayInstance.subscriptions.create(params);

      
      if (response && Object.keys(response).length) {
        let id = response.id;
        await sellerModel.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(_id) },
          { $set: { subscriptionId: id } }
        );

        await sellerSubModel.findOneAndUpdate(
          { id: new mongoose.Types.ObjectId(_id) },
          { $set: { ...dataToUpdate } }
        );
      }

      return res.send({
        status: 200,
        success: true,
        data: response,
      });
    }

    // const updatedSubscription = await axios.request(config);
    // if (
    //   updatedSubscription &&
    //   updatedSubscription.response &&
    //   updatedSubscription.response.data
    // ) {
    //   return res.send({
    //     status: 200,
    //     message: "Plan upgraded",
    //     data: updatedSubscription.response.data,
    //   });
    // }
    return res.send({
      status: 200,
      message: "Plan failed to upgrade",
      data: [],
    });
  } catch (error) {
    return res.status(500).send({ status: 500, message: error.message });
  }
};

// Downgrade Subscription Plan
exports.downgradeSubscription = async (req, res) => {
  try {
    const { _id, email } = req.user;
    let newPlan = req.body.plan;
    let totalCount = 6;
    if (newPlan == "Basic" || newPlan == "Silver") {
      totalCount = 3;
    }

    // get the planId
    let planId = planIds.filter((plan) => plan.plan == newPlan);
    let plan_id;
    if (planId) {
      plan_id = planId[0].id;
    }
    const sellerSubId = await sellerModel
      .findOne({ _id: new mongoose.Types.ObjectId(_id) })
      .select({ subscriptionId: 1 })
      .lean();

    let subscriptionId = "";
    if (sellerSubId) {
      subscriptionId = sellerSubId.subscriptionId;
    }
    let params = {};
    let expiresAt = moment(new Date())
      .add(totalCount, "months")
      .toDate()
      .getTime();

    let expiry = moment(new Date())
      .add(totalCount, "months")
      .format("DD-MM-YYYY");

    const cancelOldSubscription = await this.cancel(subscriptionId);
    if (cancelOldSubscription) {
      // create a new subscription
      params = {
        plan_id: plan_id,
        total_count: totalCount,
        quantity: 1,
        customer_notify: 1,
        expire_by: expiresAt,
        notes: {
          subscription: `${newPlan} subscription - ${totalCount}`,
        },
      };

      const dataToUpdate = {
        id: _id.toString(),
        plan: newPlan,
        expiresAt: expiry,
        email: email,
      };

      const response = await razorpayInstance.subscriptions.create(params);
      if (response && Object.keys(response).length) {
        let id = response.id;
        await sellerModel.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(_id) },
          { $set: { subscriptionId: id } }
        );
        await sellerSubModel.findOneAndUpdate(
          { id: new mongoose.Types.ObjectId(_id) },
          { $set: { ...dataToUpdate } }
        );
      }

      return res.send({
        status: 200,
        success: true,
        data: response,
      });
    }
    //   let data = JSON.stringify({
    //     plan_id: plan_id,
    //     remaining_count: 5,
    //     schedule_change_at: "now",
    //     customer_notify: 1,
    //   });

    //   let config = {
    //     method: "patch",
    //     maxBodyLength: Infinity,
    //     url: `https://api.razorpay.com/v1/subscriptions/${subscriptionId}`,
    //     headers: {
    //       "Content-Type": "application/json",
    //       Authorization:
    //         "Basic cnpwX3Rlc3RfTHVBQnVmZlBKQ3E2Zkk6YmhmOGkyYmFMcUZFeEFQOFBrcHZoMm5x",
    //     },
    //     data: data,
    //   };

    //   const updatedSubscription = await axios.request(config);
    //   if (
    //     updatedSubscription &&
    //     updatedSubscription.response &&
    //     updatedSubscription.response.data
    //   ) {
    //     return res.send({
    //       status: 200,
    //       message: "Plan upgraded",
    //       data: updatedSubscription.response.data,
    //     });
    //   }
    return res.send({
      status: 200,
      message: "Plan failed to upgrade",
      data: [],
    });
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};

// Cancel Subscription
exports.cancelSubscription = async (req, res) => {
  try {
    let { _id } = req.user;
    let subscriptionId = "";

    const sellerSubId = await sellerModel
      .findOne({ _id: new mongoose.Types.ObjectId(_id) })
      .select({ subscriptionId: 1 })
      .lean();

    if (sellerSubId) {
      subscriptionId = sellerSubId.subscriptionId;
    }
    console.log(subscriptionId);

    let data = JSON.stringify({
      cancel_at_cycle_end: 1,
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `https://api.razorpay.com/v1/subscriptions/${subscriptionId}/cancel`,
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic cnpwX3Rlc3RfTHVBQnVmZlBKQ3E2Zkk6YmhmOGkyYmFMcUZFeEFQOFBrcHZoMm5x",
      },
      data: data,
    };

    const canceledSubscription = await axios.request(config);

    if (
      canceledSubscription &&
      canceledSubscription.response &&
      canceledSubscription.response.data
    ) {
      return res.send({ status: 200, message: "Subscription cancelled" });
    } else {
      return res.send({
        status: 200,
        message: "Failed to cancel subscription",
      });
    }
  } catch (error) {

    return res.status(500).send({ status: 500, message: error.message });
  }
};

// old subscription plan for getting the subscription timeperiod
exports.oldSubscriptionPlan = async (id) => {
  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: `https://api.razorpay.com/v1/subscriptions/${id}`,
    headers: {
      Authorization:
        "Basic cnpwX3Rlc3RfTHVBQnVmZlBKQ3E2Zkk6YmhmOGkyYmFMcUZFeEFQOFBrcHZoMm5x",
    },
  };

  let result = await axios.request(config);
  if (result && result.status == 200 && result.data) {
    return result.data;
  } else {
    return false;
  }
};

//subscription cancel function
exports.cancel = async (subscriptionId) => {
  let data = JSON.stringify({
    cancel_at_cycle_end: 0,
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: `https://api.razorpay.com/v1/subscriptions/${subscriptionId}/cancel`,
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Basic cnpwX3Rlc3RfTHVBQnVmZlBKQ3E2Zkk6YmhmOGkyYmFMcUZFeEFQOFBrcHZoMm5x",
    },
    data: data,
  };

  // const canceledSubscription = await razorpayInstance.subscriptions.cancel(
  //   subscriptionId
  // );
  const canceledSubscription = await axios.request(config);

  if (canceledSubscription && canceledSubscription.data) {
    return canceledSubscription.data;
  }
};

// Function to create Razorpay plans
const createRazorpayPlan = async (planName, amount, interval) => {
  try {
    const plan = await razorpayInstance.plans.create({
      period: 'monthly',
      interval: interval,
      item: {
        name: `${planName} Plan`,
        amount: Math.round(amount * 100), // Convert to paise and ensure integer
        currency: 'INR',
        description: `${planName} Subscription Plan`,
      },
    });
    console.log(`${planName} Plan created:`, plan.id);
    return plan.id;
  } catch (error) {
    console.error(`Error creating ${planName} plan:`, error);
    return null;
  }
};

// Function to create all plans
exports.createAllPlans = async (req, res) => {
  try {
    const plans = [
      { name: 'Silver', amount: 5999, interval: 3 },
      { name: 'Silver', amount: 5999, interval: 5 },
      { name: 'Silver', amount: 5999, interval: 9 },
      { name: 'Gold', amount: 7999, interval: 3 },
      { name: 'Gold', amount: 7999, interval: 5 },
      { name: 'Gold', amount: 7999, interval: 9 },
      { name: 'Platinum', amount: 11999, interval: 3 },
      { name: 'Platinum', amount: 11999, interval: 5 },
      { name: 'Platinum', amount: 11999, interval: 9 },
    ];

    const createdPlans = [];
    for (const plan of plans) {
      console.log('Creating plan:', plan);
      const planId = await createRazorpayPlan(plan.name, plan.amount, plan.interval);
      console.log('Created planId:', planId);
      if (planId) {
        createdPlans.push({
          plan: plan.name,
          timePeriod: plan.interval.toString(),
          id: planId,
          price: (plan.amount * plan.interval).toString()
        });
      }
    }

    console.log('Created plans:', createdPlans);
    res.json({ success: true, plans: createdPlans });
  } catch (error) {
    console.error('Error creating plans:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Test Razorpay connectivity
exports.testRazorpay = async (req, res) => {
  try {
    // Test 1: Check credentials
    console.log('Testing Razorpay credentials...');
    console.log('Key ID:', process.env.RAZORPAY_KEY_ID ? 'Present' : 'Missing');
    console.log('Key Secret:', process.env.RAZORPAY_KEY_SECRET ? 'Present' : 'Missing');

    // Test 2: Try to fetch plans
    console.log('Testing plan fetch...');
    const plans = await razorpayInstance.plans.all();
    console.log('Available plans count:', plans.items?.length || 0);

    // Test 3: Check specific plan
    const testPlanId = 'plan_OoDwcKnUOahVEt'; // Your Gold 3-month plan
    try {
      const plan = await razorpayInstance.plans.fetch(testPlanId);
      console.log('Test plan found:', plan.id, plan.item.name);
    } catch (planError) {
      console.log('Test plan not found:', planError.message);
    }

    res.json({
      success: true,
      message: 'Razorpay test completed',
      credentials: {
        keyId: process.env.RAZORPAY_KEY_ID ? 'Present' : 'Missing',
        keySecret: process.env.RAZORPAY_KEY_SECRET ? 'Present' : 'Missing'
      },
      plansCount: plans.items?.length || 0
    });
  } catch (error) {
    console.error('Razorpay test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Fetch all Razorpay plans
exports.getAllPlans = async (req, res) => {
  try {
    // You can pass query params for pagination if needed
    // e.g., { count: 20, skip: 0 }
    const plans = await razorpayInstance.plans.all();
    res.json({ success: true, plans: plans.items });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
