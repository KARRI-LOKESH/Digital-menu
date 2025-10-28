// src/pages/CartPage.jsx
import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import axios from "axios";
import "./CartPage.css";

export default function CartPage() {
  const { cart, updateQty, removeFromCart, clearCart, total } = useContext(CartContext);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const backend = "http://127.0.0.1:8000/api";

  const createOrder = async () => {
    const items = cart.map((i) => ({ menu_item: i.id, quantity: i.qty }));
    const res = await axios.post(`${backend}/orders/`, {
      name,
      phone,
      total_amount: total,
      payment_method: "online",
      items,
    });
    return res.data;
  };

  const payOnline = async () => {
    if (!name || !phone) return alert("Enter name and phone");
    setLoading(true);
    try {
      // 1️⃣ Create order in backend
      const order = await createOrder();

      // 2️⃣ Create Razorpay order
      const rzpData = await axios.post(`${backend}/create-razorpay-order/`, {
        order_id: order.id,
        amount: Math.round(order.total_amount * 100), // in paise
      });

      const { key_id, razorpay_order_id, amount } = rzpData.data;

      // 3️⃣ Load Razorpay script if not present
      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        document.body.appendChild(script);
        await new Promise((r) => (script.onload = r));
      }

      // 4️⃣ Razorpay options
      const options = {
        key: key_id,
        amount: amount,
        currency: "INR",
        name: "Hotel Menu",
        description: `Order #${order.id}`,
        order_id: razorpay_order_id,
        handler: async function (response) {
          // Verify payment in backend
          await axios.post(`${backend}/verify-payment/`, {
            order_id: order.id,
            ...response,
          });
          alert("Payment successful!");
          clearCart();
        },
        theme: { color: "#3399cc" },
      };

      // 5️⃣ Open Razorpay popup
      new window.Razorpay(options).open();
    } catch (err) {
      console.error(err);
      alert("Payment failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cart-page">
      <h2>Your Cart</h2>
      {cart.length === 0 ? (
        <p>No items yet.</p>
      ) : (
        <div className="cart-box">
          {cart.map((i) => (
            <div key={i.id} className="cart-item">
              <span>{i.name} (₹{i.price})</span>
              <input
                type="number"
                min="1"
                value={i.qty}
                onChange={(e) => updateQty(i.id, Number(e.target.value))}
              />
              <button onClick={() => removeFromCart(i.id)}>❌</button>
            </div>
          ))}

          <h3>Total: ₹{total}</h3>

          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />

          <div className="cart-buttons">
            <button onClick={payOnline} disabled={loading}>
              Pay Online
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
