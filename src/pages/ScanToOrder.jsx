import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { motion } from "framer-motion";
import "./ScanToOrder.css";

export default function ScanToOrder() {
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      qrbox: { width: 250, height: 250 },
      fps: 10,
    });

    scanner.render(
      (decodedText) => {
        setScanResult(decodedText);
        window.open(decodedText, "_blank");
        scanner.clear();
      },
      (error) => {
        console.warn("QR Scan error:", error);
      }
    );

    return () => {
      scanner.clear().catch((err) => console.error(err));
    };
  }, []);

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
        className="qr-card fancy-glow"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div id="reader" style={{ width: "260px" }}></div>

        {scanResult && (
          <p className="scan-result">✅ Scanned Link: {scanResult}</p>
        )}
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
