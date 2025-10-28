import React from "react";
import { motion } from "framer-motion";
import "./ScanToOrder.css";

export default function ScanToOrder() {
  // ✅ Directly link to deployed menu page
  const qrImageUrl = "https://api.qrserver.com/v1/create-qr-code/?data=https://digital-menu-sand.vercel.app/menu/&size=250x250";

  return (
    <div className="scan-container">
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="scan-title"
      >
        🍽️ Welcome to Hotel Lok
      </motion.h1>

      <motion.div
        className="qr-card"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <img src={qrImageUrl} alt="Menu QR" className="qr-image" />
        <p>Scan this QR code to explore our delicious menu!</p>
      </motion.div>

      <motion.footer
        className="scan-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        Powered by <span>Lokesh Digital Menu</span>
      </motion.footer>
    </div>
  );
}
