const stateModel = require("../model/state.model.js");
const cityModel = require("../model/city.model.js");

const countryModel = require("../model/country.model.js");



const mongoose = require("mongoose");

exports.storeState = async (req, res) => {
  try {
    // Extract the name from the request body
    const { name } = req.body;

    // Create a new state object with only the name field
    const newState = new stateModel({ name });

    // Save the state object to the database
    const savedState = await newState.save();

    // Respond with success message and the saved state object
    return res.status(201).json({ success: true, message: "State stored successfully", response: savedState });
  } catch (error) {
    // Handle errors
    console.error("Error storing state:", error);
    return res.status(500).json({ success: false, message: "Failed to store state", response: error.message });
  }
};
exports.getStateList = async (req, res) => {
  try {
    const { country_id } = req.params;

    // Find all states with the specified country_id from the database
    const states = await stateModel.find({ country_id: country_id }, 'id country_id name');

    // Find all states from the database

    // Respond with the list of state names
    return res.status(200).json({ success: true, message: "State List", response: states });
  } catch (error) {
    // Handle errors
    console.error("Error listing state names:", error);
    return res.status(500).json({ success: false, message: "Failed to list state names", response: error.message });
  }
};

exports.updateStateName = async (req, res) => {
  try {
    const { id } = req.params; // Extract the state ID from the request parameters
    const { name } = req.body; // Extract the new state name from the request body

    // Find the state by ID and update its name
    const updatedState = await stateModel.findByIdAndUpdate(id, { name }, { new: true });

    if (!updatedState) {
      return res.status(404).json({ success: false, message: "State not found" });
    }

    // Respond with the updated state
    return res.status(200).json({ success: true, message: "State name updated successfully", response: updatedState });
  } catch (error) {
    // Handle errors
    console.error("Error updating state name:", error);
    return res.status(500).json({ success: false, message: "Failed to update state name", response: error.message });
  }
};

exports.getCountryList = async (req, res) => {
  try {
    // Find all states from the database
    const countryList = await countryModel.find({}, 'id name');

    // Respond with the list of state names
    return res.status(200).json({ success: true, message: "Country List", response: countryList });
  } catch (error) {
    // Handle errors
    console.error("Error listing country names:", error);
    return res.status(500).json({ success: false, message: "Failed to list country names", response: error.message });
  }
};

exports.getCityList = async (req, res) => {
  try {
    // Find all states from the database
    const { state_id } = req.params;

    // Find all states with the specified country_id from the database
    const cities = await cityModel.find({ state_id: state_id }, 'id state_id name');

    // Respond with the list of state names
    return res.status(200).json({ success: true, message: "City List", response: cities });
  } catch (error) {
    // Handle errors
    console.error("Error listing City names:", error);
    return res.status(500).json({ success: false, message: "Failed to list City names", response: error.message });
  }
};