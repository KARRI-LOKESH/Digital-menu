import React, { useState } from "react";
import { motion } from "framer-motion";
import "./ScanToOrder.css";

export default function ScanToOrder() {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // ✅ Your Menu Page QR Link
  const menuLink = "https://digital-menu-4696.vercel.app/menu/";
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${menuLink}&size=250x250`;

  // ✅ If device supports BarcodeDetector → use it
  const handleScan = async () => {
    if (!("BarcodeDetector" in window)) {
      // fallback → open menu directly
      window.location.href = menuLink;
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setScanning(true);

      const video = document.createElement("video");
      video.srcObject = stream;
      video.setAttribute("playsinline", true);
      video.play();

      const barcodeDetector = new window.BarcodeDetector({
        formats: ["qr_code"],
      });

      const checkFrame = async () => {
        if (!scanning) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);

        const barcodes = await barcodeDetector.detect(canvas);
        if (barcodes.length > 0) {
          const code = barcodes[0].rawValue;
          setScanResult(code);
          setScanning(false);
          stream.getTracks().forEach((track) => track.stop());
          window.location.href = code; // ✅ Direct redirect to menu
          return;
        }

        requestAnimationFrame(checkFrame);
      };

      requestAnimationFrame(checkFrame);
    } catch (err) {
      console.error(err);
      // if user denies camera → fallback to open directly
      window.location.href = menuLink;
    }
  };

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
        {/* ✅ Clicking the QR directly redirects */}
        <img
          src={qrImageUrl}
          alt="Menu QR"
          className="qr-image"
          onClick={() => (window.location.href = menuLink)}
        />

        <p className="scan-text">Tap the QR to open our digital menu instantly!</p>

        {/* Digital Scan Option */}
        <motion.button
          className="scan-btn"
          whileTap={{ scale: 0.95 }}
          onClick={handleScan}
        >
          {scanning ? "📷 Scanning..." : "Scan Digitally"}
        </motion.button>

        {scanResult && <p className="scan-result">✅ Redirecting...</p>}
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
