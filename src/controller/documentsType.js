const documentsTypeSchema = require("../model/documentsType");
const {validateFound, validateId, validateFields} = require("../utils/commonValidations");

exports.createDocumentsType = async (req, res) => {
    const { name } = req.body;
    try {
        if (!name) {
            return validateFields(res)
        }
        const documentsType = await documentsTypeSchema.findOne({ name });
        if (documentsType) {
            return res.status(400).send({ error: "Name already exists" });
        }
        const newDocumentsType = new documentsTypeSchema({ name }); 
        await newDocumentsType.save();
        return res.status(200).send({newDocumentsType : newDocumentsType, success: "Document type created successfully" });
    } catch (error) {
        console.log(error); 
        return res.status(500).send({ error: "Something broke!" });
    }
}

exports.updateDocumentsType = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
            if (!id) {
            return validateId(res);
        }
        const documentsType = await documentsTypeSchema.findById(id);
        if (!documentsType) {
            return validateFound(res);
        }
        if(name) {
            documentsType.name = name;
        }
        await documentsType.save();
        return res.status(200).send({documentsType : documentsType, success: "Document type updated successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: "Something broke!" });
    }
}

exports.getDocumentsType = async (req, res) => {
    try {
        const documentsType = await documentsTypeSchema.find();
        return res.status(200).send({Success : "Successfully fetched", documentsType: documentsType });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: "Something broke!" });
    }
}

exports.deleteDocumentsType = async (req, res) => {
    const { id } = req.params;
    try {
        if (!id) {
            return validateId(res);
        }
        const documentsType = await documentsTypeSchema.findByIdAndDelete(id);
        return res.status(200).send({ success: "Document type deleted successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: "Something broke!" });
    }
}


const Razorpay = require("razorpay");

// Initialize Razorpay instance with your key and secret
const razorpay = new Razorpay({
  key_id: "rzp_test_LuABuffPJCq6fI",
  key_secret: "bhf8i2baLqFExAP8Pkpvh2nq",
});

// Function to create plans
const createPlan = async (planName, amount, interval, period = "monthly") => {
  try {
    const plan = await razorpay.plans.create({
      period: period, // 'weekly', 'monthly', 'yearly'
      interval: interval, // Number of periods
      item: {
        name: `${planName} Plan`,
        amount: amount * 100, // Razorpay expects amount in paise (INR)
        currency: "INR",
        description: `${planName} Plan Subscription`,
      },
    });
    console.log(`${planName} Plan ID:`, plan.id);
    return plan.id;
  } catch (error) {
    console.error(`Error creating ${planName} Plan:`, error);
  }
};

// Create plans for different subscription types
exports.createAllPlans = async () => {
  const basicPlanId = await createPlan("Basic", 0, 1);

  // Silver Plan
  const silverPlanMonthlyId = await createPlan("Silver", 5999, 1);
  const silverPlanQuarterlyId = await createPlan("Silver", 17997, 3); // 3 months
  const silverPlan5MonthsId = await createPlan("Silver", 29995, 5); // 5 months
  const silverPlanYearlyId = await createPlan("Silver", 53991, 9); // 9 months

  // Gold Plan
  const goldPlanMonthlyId = await createPlan("Gold", 7999, 1);
  const goldPlanQuarterlyId = await createPlan("Gold", 23997, 3); // 3 months
  const goldPlan5MonthsId = await createPlan("Gold", 39995, 5); // 5 months
  const goldPlanYearlyId = await createPlan("Gold", 71991, 9); // 9 months

  // Platinum Plan
  const platinumPlanMonthlyId = await createPlan("Platinum", 11999, 1);
  const platinumPlanQuarterlyId = await createPlan("Platinum", 35997, 3); // 3 months
  const platinumPlan5MonthsId = await createPlan("Platinum", 59995, 5); // 5 months
  const platinumPlanYearlyId = await createPlan("Platinum", 107991, 9); // 9 months

  // Save these plan IDs to use in your application
  console.log({
    basicPlanId,
    silverPlanMonthlyId,
    silverPlanQuarterlyId,
    silverPlan5MonthsId,
    silverPlanYearlyId,
    goldPlanMonthlyId,
    goldPlanQuarterlyId,
    goldPlan5MonthsId,
    goldPlanYearlyId,
    platinumPlanMonthlyId,
    platinumPlanQuarterlyId,
    platinumPlan5MonthsId,
    platinumPlanYearlyId,
  });
};
