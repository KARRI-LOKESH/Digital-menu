// src/pages/ServePage.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import "./ServePage.css";

const backend = "http://127.0.0.1:8000/api";

export default function ServePage() {
  const [orders, setOrders] = useState([]);
  const [serveCodeInput, setServeCodeInput] = useState({});
  const [alertMsg, setAlertMsg] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [dateFilter, setDateFilter] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  // Fetch menu items for price/name mapping
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await axios.get(`${backend}/menu-items/`);
        setMenuItems(res.data);
      } catch (err) {
        console.error("Error fetching menu items:", err);
      }
    };
    fetchMenu();
  }, []);

  // Fetch orders every 3 seconds
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`${backend}/admin/orders/`);
        setOrders(res.data);
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleDeliver = async (order_number) => {
    const code = serveCodeInput[order_number];
    if (!code) {
      setAlertMsg("⚠️ Please enter the serve code!");
      setTimeout(() => setAlertMsg(""), 3000);
      return;
    }

    try {
      const res = await axios.post(`${backend}/update-order-status/`, {
        order_number,
        serve_code: code,
        status: "Delivered",
      });

      if (res.data.success) {
        setAlertMsg(`✅ Order #${order_number} delivered successfully!`);
        setServeCodeInput((prev) => ({ ...prev, [order_number]: "" }));

        // Add to history
        const order = orders.find((o) => o.order_number === order_number);
        setHistory((prev) => [
          { ...order, delivered_at: new Date() },
          ...prev,
        ]);
      }
    } catch (err) {
      console.error("Delivery error:", err.response?.data || err);
      setAlertMsg(
        err.response?.data?.error ||
          "❌ Failed to deliver order. Check serve code."
      );
    }
    setTimeout(() => setAlertMsg(""), 4000);
  };

  const menuMap = {};
  menuItems.forEach((m) => (menuMap[m.id] = m));

  const filteredHistory = history
    .filter((h) =>
      dateFilter ? new Date(h.delivered_at).toISOString().slice(0, 10) === dateFilter : true
    )
    .slice(0, 20); // show only 20 records

  return (
    <div className="serve-container">
      <h1>🍽️ Serve Orders</h1>

      {alertMsg && <div className="alert-box">{alertMsg}</div>}

      <table className="serve-table">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Table</th>
            <th>Total (₹)</th>
            <th>Status</th>
            <th>Items</th>
            <th>Serve Code</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const total = order.items?.reduce((sum, i) => {
              const menu = menuMap[i.menu_item];
              return sum + (menu?.price || 0) * i.quantity;
            }, 0);
            return (
              <tr key={order.order_number}>
                <td>{order.order_number}</td>
                <td>{order.table_number}</td>
                <td>₹{total}</td>
                <td>{order.status}</td>
                <td>
                  {order.items?.map((i) => {
                    const menu = menuMap[i.menu_item];
                    return (
                      <div key={i.menu_item}>
                        {menu?.name || "Item"} × {i.quantity} = ₹
                        {menu ? i.quantity * menu.price : 0}
                      </div>
                    );
                  })}
                </td>
                <td>
                  {order.status !== "Delivered" && (
                    <input
                      type="text"
                      placeholder="Enter code"
                      value={serveCodeInput[order.order_number] || ""}
                      onChange={(e) =>
                        setServeCodeInput((prev) => ({
                          ...prev,
                          [order.order_number]: e.target.value,
                        }))
                      }
                    />
                  )}
                </td>
                <td>
                  {order.status !== "Delivered" ? (
                    <button onClick={() => handleDeliver(order.order_number)}>
                      Mark Delivered
                    </button>
                  ) : (
                    <span>✅ Delivered</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* History toggle */}
      <div className="history-toggle">
        <button onClick={() => setShowHistory((prev) => !prev)}>
          {showHistory ? "Hide History" : "Show History"}
        </button>
      </div>

      {/* History Section */}
      {showHistory && (
        <div className="history-box">
          <h3>📜 Delivered Orders History</h3>
          <div className="history-filters">
            <label>Filter by Date:</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Status</th>
                <th>Serve Code</th>
                <th>Items</th>
                <th>Delivered At</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((h) => (
                <tr key={h.order_number}>
                  <td>{h.order_number}</td>
                  <td>{h.status}</td>
                  <td>{h.serve_code}</td>
                  <td>
                    {h.items?.map((i) => {
                      const menu = menuMap[i.menu_item];
                      return (
                        <div key={i.menu_item}>
                          {menu?.name || "Item"} × {i.quantity} = ₹
                          {menu ? i.quantity * menu.price : 0}
                        </div>
                      );
                    })}
                  </td>
                  <td>{new Date(h.delivered_at).toLocaleString()}</td>
                </tr>
              ))}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={5}>No records found</td>
                </tr>
              )}
            </tbody>
          </table>
          {history.length > 20 && <p>Showing latest 20 orders only</p>}
        </div>
      )}
    </div>
  );
}
