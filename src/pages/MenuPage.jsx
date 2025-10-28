// src/pages/MenuPage.jsx
import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./MenuPage.css";

const RAZORPAY_KEY_ID = "rzp_test_RFVtNEzSdHSC7c";

// ✅ Use deployed backend URL (or .env variable if exists)
const backend =
  import.meta.env.VITE_API_URL || "https://digmenu-backend.onrender.com/api";

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});
  const [alertMsg, setAlertMsg] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [serveCode, setServeCode] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [orderHistory, setOrderHistory] = useState([]);

  // ----------------------------
  // Load menu + categories
  // ----------------------------
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const [itemsRes, catRes] = await Promise.all([
          fetch(`${backend}/menu-items/`),
          fetch(`${backend}/categories/`),
        ]);
        const [items, cats] = await Promise.all([
          itemsRes.json(),
          catRes.json(),
        ]);
        setMenuItems(items);
        setCategories(cats);
        if (cats.length > 0) setSelectedCategory(cats[0].id);
      } catch (err) {
        console.error("Error fetching menu data:", err);
      }
    };
    fetchMenuData();
  }, []);

  // ----------------------------
  // Load history from localStorage
  // ----------------------------
  useEffect(() => {
    const storedHistory = JSON.parse(localStorage.getItem("orderHistory") || "[]");
    setOrderHistory(storedHistory);
  }, []);

  const filteredItems = selectedCategory
    ? menuItems.filter((item) => item.category === selectedCategory)
    : menuItems;

  const handleQtyChange = (id, qty) => {
    setSelectedItems((prev) => ({ ...prev, [id]: qty }));
  };

  const getTotal = () => {
    return Object.keys(selectedItems).reduce((sum, id) => {
      const item = menuItems.find((i) => i.id === parseInt(id));
      return item ? sum + item.price * selectedItems[id] : sum;
    }, 0);
  };

  // ----------------------------
  // Poll backend for delivery status
  // ----------------------------
  useEffect(() => {
    let interval;
    if (orderNumber) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${backend}/admin/orders/`);
          const orders = await res.json();
          const currentOrder = orders.find((o) => o.order_number === orderNumber);
          if (currentOrder && currentOrder.status === "Delivered") {
            setShowQR(false);
            setOrderNumber("");
            setServeCode("");
            setAlertMsg("✅ Your food has been delivered!");
            setTimeout(() => setAlertMsg(""), 5000);

            // Update history status
            setOrderHistory((prev) =>
              prev.map((h) =>
                h.order_number === currentOrder.order_number
                  ? { ...h, status: "Delivered" }
                  : h
              )
            );
            localStorage.setItem(
              "orderHistory",
              JSON.stringify(
                orderHistory.map((h) =>
                  h.order_number === currentOrder.order_number
                    ? { ...h, status: "Delivered" }
                    : h
                )
              )
            );

            clearInterval(interval);
          }
        } catch (err) {
          console.error("Error checking delivery:", err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [orderNumber, orderHistory]);

  // ----------------------------
  // Payment
  // ----------------------------
  const handlePayment = async (amount) => {
    try {
      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        document.body.appendChild(script);
        await new Promise((r) => (script.onload = r));
      }

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: amount * 100,
        currency: "INR",
        name: "Hotel Digital Menu",
        description: `Food Order - Table ${tableNumber}`,
        handler: async function () {
          const res = await fetch(`${backend}/create-order-after-payment/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              table_number: tableNumber,
              total_amount: amount,
              items: Object.keys(selectedItems)
                .filter((id) => selectedItems[id] > 0)
                .map((id) => ({
                  menu_item: parseInt(id),
                  quantity: selectedItems[id],
                })),
            }),
          });

          const data = await res.json();
          if (data.success) {
            const newOrder = {
              order_number: data.order_number,
              serve_code: data.serve_code,
              total: amount,
              table: tableNumber,
              status: "Paid",
              items: Object.keys(selectedItems)
                .filter((id) => selectedItems[id] > 0)
                .map((id) => {
                  const item = menuItems.find((i) => i.id === parseInt(id));
                  return { name: item.name, qty: selectedItems[id], price: item.price };
                }),
            };

            const updatedHistory = [...orderHistory, newOrder];
            setOrderHistory(updatedHistory);
            localStorage.setItem("orderHistory", JSON.stringify(updatedHistory));

            setOrderNumber(data.order_number);
            setServeCode(data.serve_code);
            setAlertMsg(`✅ Payment Successful! Order #${data.order_number}`);
            setShowQR(true);
            setSelectedItems({});
            setTableNumber("");
            setTimeout(() => setAlertMsg(""), 5000);
          } else {
            setAlertMsg("❌ Payment failed. Try again.");
          }
        },
        theme: { color: "#ff6600" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
      setAlertMsg("❌ Payment failed. Please try again.");
      setTimeout(() => setAlertMsg(""), 3000);
    }
  };

  const orderNow = () => {
    if (!tableNumber) {
      setAlertMsg("⚠️ Please select a table number!");
      setTimeout(() => setAlertMsg(""), 3000);
      return;
    }

    const items = Object.keys(selectedItems)
      .filter((id) => selectedItems[id] > 0)
      .map((id) => ({ menu_item: parseInt(id), quantity: selectedItems[id] }));

    if (items.length === 0) {
      setAlertMsg("⚠️ Please select at least one item!");
      setTimeout(() => setAlertMsg(""), 3000);
      return;
    }

    handlePayment(getTotal());
  };


  const selectedList = Object.keys(selectedItems)
    .filter((id) => selectedItems[id] > 0)
    .map((id) => {
      const item = menuItems.find((i) => i.id === parseInt(id));
      return { ...item, qty: selectedItems[id] };
    });

  // ----------------------------
  // Download slip
  // ----------------------------
  const downloadSlip = (order) => {
    const slip = document.createElement("div");
    slip.style.width = "250px";
    slip.style.padding = "10px";
    slip.style.fontFamily = "sans-serif";
    slip.style.background = "#fff";

    let itemsHTML = "";
    order.items.forEach((i) => {
      itemsHTML += `<p>${i.qty} × ${i.name} = ₹${i.qty * i.price}</p>`;
    });

    slip.innerHTML = `
      <h3>Hotel Digital Menu</h3>
      <p>Order #: ${order.order_number}</p>
      <p>Serve Code: ${order.serve_code}</p>
      <p>Table: ${order.table}</p>
      ${itemsHTML}
      <p>Total: ₹${order.total}</p>
      <p>Status: ${order.status}</p>
      <hr/>
      <p>Thank you for your order!</p>
    `;
    document.body.appendChild(slip);

    html2canvas(slip).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      pdf.addImage(imgData, "PNG", 10, 10, 180, 0);
      pdf.save(`Order_${order.order_number}.pdf`);
      document.body.removeChild(slip);
    });
  };

  // ----------------------------
  // Re-order previous order
  // ----------------------------
  const reorder = (order) => {
    const newSelected = {};
    order.items.forEach((i) => {
      const item = menuItems.find((mi) => mi.name === i.name);
      if (item) newSelected[item.id] = i.qty;
    });
    setSelectedItems(newSelected);
    setTableNumber(order.table);
    setAlertMsg("⚠️ Previous order loaded. Modify quantities if needed.");
    setTimeout(() => setAlertMsg(""), 3000);
  };

  return (
    <div className="menu-container">
      <h1>🍽️ Our Menu</h1>

      {alertMsg && <div className="alert-box">{alertMsg}</div>}

      {/* Table select */}
      <div className="table-select">
        <label>🪑 Select Table Number:</label>
        <select
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
        >
          <option value="">-- Choose Table --</option>
          {Array.from({ length: 50 }, (_, i) => i + 1).map((num) => (
            <option key={num} value={num}>
              Table {num}
            </option>
          ))}
        </select>
      </div>

      {/* Category tabs */}
      <div className="category-tabs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={selectedCategory === cat.id ? "active" : ""}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu grid */}
      <div className="menu-grid">
        {filteredItems.map((item) => (
          <div className="menu-card" key={item.id}>
            <img
              src={item.image || "https://via.placeholder.com/150"}
              alt={item.name}
              className="menu-img"
            />
            <h3>{item.name}</h3>
            <p>{item.description || "Delicious dish"}</p>
            <div className="menu-footer">
              <span>₹{item.price}</span>
              <input
                type="number"
                min="0"
                value={selectedItems[item.id] || 0}
                onChange={(e) =>
                  handleQtyChange(item.id, parseInt(e.target.value) || 0)
                }
              />
            </div>
          </div>
        ))}
      </div>

      {/* Selected Items */}
      {selectedList.length > 0 && (
        <div className="cart-summary">
          <h2>🛒 Your Order</h2>
          {selectedList.map((item) => (
            <div className="cart-item" key={item.id}>
              <img
                src={item.image || "https://via.placeholder.com/100"}
                alt={item.name}
                className="cart-img"
              />
              <div className="cart-details">
                <h4>{item.name}</h4>
                <p>
                  {item.qty} × ₹{item.price} = ₹{item.qty * item.price}
                </p>
              </div>
            </div>
          ))}
          <h3>Total: ₹{getTotal()}</h3>
          <button onClick={orderNow}>Order Now & Pay</button>
        </div>
      )}

      {/* QR Section */}
      {showQR && orderNumber && serveCode && (
        <div className="qr-section">
          <h4>
            Scan to view/order: Order #{orderNumber} (Code {serveCode})
          </h4>
          <QRCodeCanvas
            value={`upi://pay?pa=7993549539@ybl&pn=Hotel&cu=INR&am=${getTotal()}&tn=Table${tableNumber}&oid=${orderNumber}&scode=${serveCode}`}
            size={200}
          />
        </div>
      )}

      {/* History section */}
      {orderHistory.length > 0 && (
        <div className="history-box">
          <h3>📜 Order History</h3>
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Items</th>
                <th>Code</th>
                <th>Table</th>
                <th>Total (₹)</th>
                <th>Status</th>
                <th>Slip</th>
                <th>Re-order</th>
              </tr>
            </thead>
            <tbody>
              {orderHistory.map((h) => (
                <tr key={h.order_number}>
                  <td>{h.order_number}</td>
                  <td>
                    {h.items.map((i, idx) => (
                      <div key={idx}>
                        {i.qty} × {i.name}
                      </div>
                    ))}
                  </td>
                  <td>{h.serve_code}</td>
                  <td>{h.table}</td>
                  <td>{h.total}</td>
                  <td>{h.status}</td>
                  <td>
                    <button onClick={() => downloadSlip(h)}>Download Slip</button>
                  </td>
                  <td>
                  <button onClick={() => reorder(h)}>Re-order</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

