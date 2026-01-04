exports.subscription = [
  // {
  //   planName: "Basic",
  //   features: [

  //     { name: "Plan Validity", content:"Lifetime" },
  //     { name: "Number of Project Listings", content:"1" },
  //     { name: "Seller Dashboard Access", isIncluded: false },
  //     { name: "Access to Buyer Enquiries", isIncluded: false },
  //     { name: "Higher Position of Property in Farmland Bazaar Search", isIncluded: false },
  //     {
  //       name: "Support - Email",
  //       isIncluded: false,
  //     },
  //     { name: "Relationship Manager Assistance", isIncluded: false },
  //     { name: "Guaranteed Enquiries ", isIncluded: false },
  //     { name: "Email promotions", isIncluded: false },
  //     { name: "Social Media Marketing", isIncluded: false },
  //     { name: "Project Video promotion on FarmlandBazaar YouTube channel", isIncluded: false },
  //     { name: "Monthly Report", isIncluded: false },
  //     { name: "Exclusive Brand Story", isIncluded: false },
  //     { name: "Bonus (Select one - Featured Project or Featured Developer)", isIncluded: false },
  //   ],
  //   monthlyPrice: "0",
  //   actualprice:"0",
  //   discountedPrice:"0",
  //   timePeriod: "",
  // },
  {
    planName: "Silver",
    features: [
      { name: "Plan Validity", content:"365 Days" },
      { name: "Number of Project Listings", content:"3" },
      { name: "Seller Dashboard Access", isIncluded: true },
      { name: "Access to Buyer Enquiries", isIncluded: true },
      { name: "Higher Position of Property in Farmland Bazaar Search", isIncluded: false },
      {
        name: "Support - Email",
        isIncluded: true,
      },
      { name: "Relationship Manager Assistance", isIncluded: false },
      { name: "Guaranteed Enquiries ", isIncluded: false },
      { name: "Email promotions", isIncluded: false },
      { name: "Social Media Marketing", isIncluded: true ,content:"1 Posts"},
      { name: "Project Video promotion on FarmlandBazaar YouTube channel", isIncluded: false },
      { name: "Monthly Report", isIncluded: false },
      { name: "Exclusive Brand Story", isIncluded: false },
      { name: "Bonus (Select one - Featured Project or Featured Developer)", isIncluded: false },
    ],
    monthlyPrice: "333.33",
    actualprice:"8000",
    discountedPrice:"4000",

    timePeriod: "12",
  },
  {
    planName: "Gold",
    features: [
      { name: "Plan Validity", content:"90 Days" },
      { name: "Number of Project Listings", content:"Unlimited" },
      { name: "Seller Dashboard Access", isIncluded: true },
      { name: "Access to Buyer Enquiries", isIncluded: true },
      { name: "Higher Position of Property in Farmland Bazaar Search", isIncluded: true },
      {
        name: "Support - Email",
        isIncluded: true,
      },
      { name: "Relationship Manager Assistance", isIncluded: true },
      { name: "Guaranteed Enquiries ", isIncluded: true ,content:"(25-30)"},
      { name: "Email promotions", isIncluded: true,content:"400 Contacts"},
      { name: "Social Media Marketing", isIncluded: true ,content:"3 Posts"},
      { name: "Project Video promotion on FarmlandBazaar YouTube channel", isIncluded: false },
      { name: "Monthly Report", isIncluded: false },
      { name: "Exclusive Brand Story", isIncluded: false },
      { name: "Bonus (Select one - Featured Project or Featured Developer)", isIncluded: false },
    ],
    monthlyPrice: "8000",
    actualprice:"36000",
    discountedPrice:"24000",
    timePeriod: "3",
  },
  {
    planName: "Platinum",
    features: [
      { name: "Plan Validity", content:"90 Days" },
      { name: "Number of Project Listings", content:"Unlimited" },
      { name: "Seller Dashboard Access", isIncluded: true },
      { name: "Access to Buyer Enquiries", isIncluded: true },
      { name: "Higher Position of Property in Farmland Bazaar Search", isIncluded: true },
      {
        name: "Support - Email",
        isIncluded: true,
      },
      { name: "Relationship Manager Assistance", isIncluded: true },
      { name: "Guaranteed Enquiries ", isIncluded: true,content:"(40-50)" },
      { name: "Email promotions", isIncluded: true ,content:"800 Contacts" },
      { name: "Social Media Marketing", isIncluded: true ,content:"6 Posts"},
      { name: "Project Video promotion on FarmlandBazaar YouTube channel", isIncluded: true },
      { name: "Monthly Report", isIncluded: true },
      { name: "Exclusive Brand Story", isIncluded: true },
      { name: "Bonus (Select one - Featured Project or Featured Developer)", isIncluded: true },
    ],
    monthlyPrice: "13000",
    actualprice:"66000",
    discountedPrice:"39000",
    timePeriod: "3",
    
  },
];

// exports.planIds = [
//   {
//     plan: "Basic",
//     id: "plan_NqIfSmfuAROIff",
//   },
//   {
//     plan: "Silver",
//     id: "plan_NqgHrF4HwPmFuU",
//   },
//   {
//     plan: "Gold",
//     id: "plan_NqgItqCXR4TNex",
//   },
//   {
//     plan: "Platinum",
//     id: "plan_NqgJVAxDcQ950I",
//   },
// ];

exports.planIds = [
  {
    plan: "Silver",
    timePeriod: "3",
    id: process.env.SP3, 
    price : "17997"
  },
  {
    plan: "Silver",
    timePeriod: "5",
    id: process.env.SP5, 
    price : "29995"
  },
  {
    plan: "Silver",
    timePeriod: "12",
    id:  process.env.SP12, 
    price : "4720"
  },
  {
    plan: "Gold",
    timePeriod: "3",
    id: process.env.GP3, 
    price : "28320"
  },
  {
    plan: "Gold",
    timePeriod: "5",
    id:  process.env.GP5, 
    price : "39995"
  },
  {
    plan: "Gold",
    timePeriod: "9",
    id: process.env.GP9, 
    price : "84960"
  },
  {
    plan: "Platinum",
    timePeriod: "3",
    id:  process.env.PP3, 
    price : "46020"
  },
  {
    plan: "Platinum",
    timePeriod: "5",
    id:  process.env.PP5,
    price : "76700" 
  },
  {
    plan: "Platinum",
    timePeriod: "9",
    id: process.env.PP9,
    price : "138060"
  },
];