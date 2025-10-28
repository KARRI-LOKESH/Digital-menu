import { useState, useContext } from "react";
import { CartContext } from "../context/CartContext";

export default function MenuItemCard({ item }) {
  const { addToCart } = useContext(CartContext);
  const [qty, setQty] = useState(1);

  return (
    <div className="menu-item">
      {item.image && (
        <img
          src={item.image}
          alt={item.name}
          className="menu-img"
        />
      )}
      <h3>{item.name}</h3>
      <p>₹{item.price}</p>
      <div className="controls">
        <input
          type="number"
          min="1"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
        />
        <button onClick={() => addToCart(item, qty)}>Add</button>
      </div>
    </div>
  );
}
