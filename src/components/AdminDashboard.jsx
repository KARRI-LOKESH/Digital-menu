import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminDashboard.css";

const backend = "http://127.0.0.1:8000/api";

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${backend}/admin/orders/`);
      setOrders(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setLoading(false);
    }
  };

  // Fetch menu items to map IDs to names/prices
  const fetchMenu = async () => {
    try {
      const res = await axios.get(`${backend}/menu-items/`);
      setMenuItems(res.data);
    } catch (err) {
      console.error("Failed to fetch menu items:", err);
    }
  };

  // Serve order
  const handleServe = async (orderNumber) => {
    try {
      const res = await axios.post(`${backend}/serve-order/`, {
        order_number: orderNumber,
      });

      if (res.data.message) {
        setOrders((prev) =>
          prev.map((order) =>
            order.order_number === orderNumber
              ? { ...order, served: true, status: "Served" }
              : order
          )
        );
        alert(res.data.message);
      } else if (res.data.error) {
        alert(res.data.error);
      }
    } catch (err) {
      console.error("Serve order error:", err);
      alert("Failed to serve order");
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchMenu();
    const interval = setInterval(() => {
      fetchOrders();
    }, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, []);

  // Map menu item ID → object
  const menuMap = {};
  menuItems.forEach((m) => (menuMap[m.id] = m));

  if (loading) return <p>Loading orders...</p>;

  return (
    <div className="admin-container">
      <h1>🍽️ Admin Dashboard</h1>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Table</th>
            <th>Order #</th>
            <th>Items</th>
            <th>Total (₹)</th>
            <th>Status</th>
            <th>Serve</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: "center" }}>
                No orders yet
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr
                key={order.order_number}
                className={order.served ? "served-row" : ""}
              >
                <td>{order.table_number || "-"}</td>
                <td>{order.order_number}</td>
                <td>
                  {order.items.map((item, idx) => {
                    const menu = menuMap[item.menu_item];
                    return (
                      <div key={idx}>
                        {item.quantity} × {menu?.name || "Item"} = ₹
                        {(menu?.price || 0) * item.quantity}
                      </div>
                    );
                  })}
                </td>
                <td>{order.total_amount}</td>
                <td>{order.status}</td>
                <td>
                  {order.served ? (
                    <span className="served-text">✅ Served</span>
                  ) : (
                    <button
                      className="serve-btn"
                      onClick={() => handleServe(order.order_number)}
                    >
                      Serve
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
