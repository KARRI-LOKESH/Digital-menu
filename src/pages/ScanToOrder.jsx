// src/pages/ScanToOrder.jsx
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import jsQR from "jsqr"; // npm i jsqr
import "./ScanToOrder.css";

export default function ScanToOrder() {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const streamRef = useRef(null);

  const qrImageUrl =
    "https://api.qrserver.com/v1/create-qr-code/?data=https://digital-menu-4696.vercel.app/menu/&size=250x250";

  // Stop camera & animation loop
  const stopScanner = () => {
    setScanning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch (e) {}
    }
  };

  // Main scan loop
  const tickAndScan = async (useNativeDetector) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Ensure video has dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      rafRef.current = requestAnimationFrame(() => tickAndScan(useNativeDetector));
      return;
    }

    // Set canvas size to video size (important)
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      if (useNativeDetector && "BarcodeDetector" in window) {
        // Native BarcodeDetector (fast)
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        const barcodes = await detector.detect(canvas);
        if (barcodes && barcodes.length > 0) {
          const code = barcodes[0].rawValue;
          setScanResult(code);
          stopScanner();
          window.open(code, "_blank");
          return;
        }
      } else {
        // Fallback: jsQR
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });
        if (code && code.data) {
          setScanResult(code.data);
          stopScanner();
          window.open(code.data, "_blank");
          return;
        }
      }
    } catch (err) {
      // If native detector throws (some browsers), fall back gracefully
      console.warn("Detector error:", err);
      if (useNativeDetector) {
        // try jsQR next frame
        rafRef.current = requestAnimationFrame(() => tickAndScan(false));
        return;
      }
    }

    // continue scanning
    rafRef.current = requestAnimationFrame(() => tickAndScan(useNativeDetector));
  };

  const handleScan = async () => {
    setErrorMsg("");
    setScanResult(null);

    // Check if secure context - getUserMedia requires HTTPS or localhost
    if (location.protocol !== "https:" && location.hostname !== "localhost") {
      setErrorMsg("Camera needs HTTPS. Deploy or use localhost for testing.");
      return;
    }

    try {
      // Prefer environment camera on mobile
      const constraints = {
        video: {
          facingMode: { ideal: "environment" }, // try back camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", true); // iOS
        await videoRef.current.play();
      }

      setScanning(true);

      // Decide detector: native if available else jsQR fallback
      const useNativeDetector = "BarcodeDetector" in window;

      // Start scan loop
      rafRef.current = requestAnimationFrame(() => tickAndScan(useNativeDetector));
    } catch (err) {
      console.error("Camera/permission error:", err);
      setErrorMsg("Camera access denied or not available on this device/browser.");
      setScanning(false);
    }
  };

  // Clean up when component unmounts (optional safety)
  React.useEffect(() => {
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <img src={qrImageUrl} alt="Menu QR" className="qr-image" />
        <p className="scan-text">Scan this QR code to explore our delicious menu!</p>

        <motion.div style={{ marginTop: 12 }}>
          {!scanning ? (
            <motion.button
              className="scan-btn"
              whileTap={{ scale: 0.95 }}
              onClick={handleScan}
            >
              📱 Scan Digitally
            </motion.button>
          ) : (
            <motion.button
              className="scan-btn"
              whileTap={{ scale: 0.95 }}
              onClick={() => stopScanner()}
            >
              ⏹ Stop Scanning
            </motion.button>
          )}
        </motion.div>

        {errorMsg && <p style={{ color: "#ff7b00", marginTop: 10 }}>{errorMsg}</p>}
        {scanResult && <p className="scan-result">✅ Scanned Link: {scanResult}</p>}
      </motion.div>

      <motion.footer
        className="scan-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        Powered by <span>Lokesh Digital Menu</span>
      </motion.footer>

      {/* Overlay: show live video while scanning */}
      {scanning && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            background: "rgba(0,0,0,0.6)",
            padding: 20,
          }}
        >
          <div
            style={{
              width: "min(720px, 92vw)",
              maxWidth: 720,
              background: "rgba(255,255,255,0.03)",
              borderRadius: 12,
              padding: 12,
              boxShadow: "0 0 30px rgba(0,255,200,0.12)",
              textAlign: "center",
            }}
          >
            <video
              ref={videoRef}
              style={{
                width: "100%",
                height: "auto",
                borderRadius: 8,
                transform: "scaleX(-1)", // mirror for user-friendly preview (optional)
                boxShadow: "0 0 18px rgba(0,255,200,0.12)",
              }}
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            <div style={{ marginTop: 10, display: "flex", gap: 8, justifyContent: "center" }}>
              <button
                onClick={() => {
                  // quick stop
                  stopScanner();
                }}
                style={{
                  background: "#ff6600",
                  border: "none",
                  padding: "8px 14px",
                  color: "#fff",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <div style={{ color: "#cfe", alignSelf: "center" }}>
                Point camera at the printed QR (hold steady)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
