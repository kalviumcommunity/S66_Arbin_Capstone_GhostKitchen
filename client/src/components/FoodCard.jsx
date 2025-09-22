import React, { useState } from "react";

export default function FoodCard({ food, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFood, setEditedFood] = useState({ ...food });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedFood((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onUpdate(editedFood);
    setIsEditing(false);
  };

  return (
    <div className="food-card" style={styles.card}>
      {isEditing ? (
        <div style={styles.editForm}>
          <input
            type="text"
            name="name"
            value={editedFood.name}
            onChange={handleChange}
            style={styles.input}
          />
          <input
            type="text"
            name="category"
            value={editedFood.category}
            onChange={handleChange}
            style={styles.input}
          />
          <input
            type="text"
            name="subcategory"
            value={editedFood.subcategory}
            onChange={handleChange}
            style={styles.input}
          />
          <input
            type="number"
            name="price"
            value={editedFood.price}
            onChange={handleChange}
            style={styles.input}
          />
          <button onClick={handleSave} style={styles.saveBtn}>
            Save
          </button>
        </div>
      ) : (
        <div style={styles.cardContent}>
          {/* LEFT SIDE → Name + Best Seller */}
          <div style={styles.left}>
            <h3 style={styles.name}>
              {food.name}
              {food.isBestSeller && (
                <span style={styles.bestSeller}>Best Seller</span>
              )}
            </h3>
            <p style={styles.category}>
              {food.category} • {food.subcategory}
            </p>
          </div>

          {/* RIGHT SIDE → Price + Delete */}
          <div style={styles.right}>
            <p style={styles.price}>₹{food.price}</p>
            <div>
              <button onClick={() => setIsEditing(true)} style={styles.editBtn}>
                Edit
              </button>
              <button onClick={() => onDelete(food.id)} style={styles.deleteBtn}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    padding: "15px",
    marginBottom: "12px",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  },
  cardContent: {
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
  },
  left: {
    display: "flex",
    flexDirection: "column",
  },
  right: {
    textAlign: "right",
  },
  name: {
    fontSize: "18px",
    margin: "0",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  bestSeller: {
    fontSize: "12px",
    color: "red",
    fontWeight: "bold",
  },
  category: {
    fontSize: "14px",
    color: "#555",
  },
  price: {
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "6px",
  },
  editBtn: {
    marginRight: "8px",
    padding: "4px 10px",
    fontSize: "12px",
    cursor: "pointer",
  },
  deleteBtn: {
    padding: "4px 10px",
    fontSize: "12px",
    cursor: "pointer",
  },
  input: {
    marginBottom: "6px",
    padding: "6px",
    width: "100%",
  },
  saveBtn: {
    padding: "6px 12px",
    fontSize: "12px",
    cursor: "pointer",
  },
};
