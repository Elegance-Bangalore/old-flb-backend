const { default: mongoose, Schema } = require("mongoose");

const missionSchema = new Schema({
    icon: {
        type: String,
    },
    heading: {
        type: String,
    },
    description: {
        type: String,
    },
});

const aboutUsSchema = new Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
    },
    title: {
        type: String,
        required: true,
    },
    subtitle: {
        type: String,
        required: true,
    },
    heroImage: {
        type: String,
        required: true,
    },
    mission: [missionSchema], // Change here
    logo: {
        type: String,
    },
    content: {
        type: String,
    },
},
{ timestamps: true });

const AboutUs = mongoose.model("aboutus", aboutUsSchema);

module.exports = AboutUs;
