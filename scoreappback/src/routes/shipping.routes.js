import express from "express";
import { addshipfee, getshipfee, updateshipfee, deleteshipfee } from "../controllers/shippfeeControl.js";
import { protect, adminOnly } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getshipfee);
router.post("/", protect, adminOnly, addshipfee);
router.put("/:id", protect, adminOnly, updateshipfee);
router.delete("/:id", protect, adminOnly, deleteshipfee);

export default router;
