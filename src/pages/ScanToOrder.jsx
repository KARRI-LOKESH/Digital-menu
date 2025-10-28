import React, { useState } from "react";
import { motion } from "framer-motion";
import "./ScanToOrder.css";

export default function ScanToOrder() {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const menuLink = "https://digital-menu-4696.vercel.app/menu/";
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(menuLink)}&size=250x250`;

  const handleScan = async () => {
    // ✅ If BarcodeDetector not supported → open menu page directly
    if (!("BarcodeDetector" in window)) {
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
      await video.play();

      const barcodeDetector = new window.BarcodeDetector({ formats: ["qr_code"] });

      const checkFrame = async () => {
        if (!scanning) {
          stream.getTracks().forEach((t) => t.stop());
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
          stream.getTracks().forEach((t) => t.stop());
          window.location.href = code; // ✅ redirect directly
          return;
        }

        requestAnimationFrame(checkFrame);
      };

      requestAnimationFrame(checkFrame);
    } catch (err) {
      console.error(err);
      alert("Camera access denied or unavailable.");
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
        {/* ✅ Direct click on QR also redirects on mobile */}
        <img
          src={qrImageUrl}
          alt="Menu QR"
          className="qr-image"
          onClick={() => (window.location.href = menuLink)}
        />
        <p className="scan-text">
          Tap or Scan this QR code to explore our delicious menu!
        </p>

        <motion.button
          className="scan-btn"
          whileTap={{ scale: 0.95 }}
          onClick={handleScan}
        >
          {scanning ? "📷 Scanning..." : "📱 Scan Digitally"}
        </motion.button>

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
