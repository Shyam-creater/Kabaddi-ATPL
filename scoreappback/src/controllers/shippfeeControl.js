import mongoose from "mongoose";
import { shipfeeModelSchema } from "../models/shipfee.js";

export const addshipfee = async (req, res) => {
  try {
    const { state, productdeliveryfee, combodeliveryfee, above500_deliveryfee, above_1kg_deliveryfee } = req.body;
    
    // Validation
    if (!state || productdeliveryfee === undefined || combodeliveryfee === undefined || above500_deliveryfee === undefined || above_1kg_deliveryfee === undefined) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const newShipfee = new shipfeeModelSchema({
      state,
      productdeliveryfee,
      combodeliveryfee,
      above500_deliveryfee,
      above_1kg_deliveryfee,
      created_at: new Date(),
    });
    
    await newShipfee.save();
    
    return res.status(201).json({
      success: true,
      message: "Shipping fee added successfully",
      data: newShipfee
    });
  } catch (err) {
    console.error("Error adding shipfee:", err);
    return res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
}

export const getshipfee = async (req, res) => {
  try {
    const data = await shipfeeModelSchema.find().exec();
    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    console.error("Error getting shipfees:", err);
    return res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
}

export const updateshipfee = async (req, res) => {
  try {
    const { id } = req.params;
    const { state, productdeliveryfee, combodeliveryfee, above500_deliveryfee, above_1kg_deliveryfee } = req.body;

    const updatedFee = await shipfeeModelSchema.findByIdAndUpdate(
      id,
      {
        state,
        productdeliveryfee,
        combodeliveryfee,
        above500_deliveryfee,
        above_1kg_deliveryfee
      },
      { new: true }
    );

    if (!updatedFee) {
      return res.status(404).json({ success: false, message: "Shipping fee not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Shipping fee updated successfully",
      data: updatedFee
    });
  } catch (err) {
    console.error("Error updating shipfee:", err);
    return res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
}

export const deleteshipfee = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedFee = await shipfeeModelSchema.findByIdAndDelete(id);
    
    if (!deletedFee) {
      return res.status(404).json({ success: false, message: "Shipping fee not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Shipping fee deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting shipfee:", err);
    return res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
}