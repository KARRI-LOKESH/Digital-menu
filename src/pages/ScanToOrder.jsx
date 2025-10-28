import React from "react";
import { motion } from "framer-motion";
import "./ScanToOrder.css";

export default function ScanToOrder() {
  const qrImageUrl = "http://127.0.0.1:8000/media/qrcodes/menu_qr.png";

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
