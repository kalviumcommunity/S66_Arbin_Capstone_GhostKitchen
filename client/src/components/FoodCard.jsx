import React, { useState } from "react";

export default function FoodCard({ food, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFood, setEditedFood] = useState({ ...food });

  // ✅ Validation check
  const isValid =
    editedFood.name.trim() !== "" &&
    !isNaN(editedFood.price) &&
    Number(editedFood.price) > 0;

  const handleSave = () => {
    if (isValid) {
      onUpdate(editedFood);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedFood({ ...food }); // reset to original
    setIsEditing(false);
  };

  return (
    <div className="card">
      {isEditing ? (
        <>
          <input
            type="text"
            value={editedFood.name}
            onChange={(e) =>
              setEditedFood({ ...editedFood, name: e.target.value })
            }
          />
          <input
            type="number"
            value={editedFood.price}
            onChange={(e) =>
              setEditedFood({ ...editedFood, price: e.target.value })
            }
          />
          <button onClick={handleSave} disabled={!isValid}>
            Save
          </button>
          <button onClick={handleCancel}>Cancel</button>
        </>
      ) : (
        <>
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <h3 style={{ margin: 0 }}>{food.name}</h3>
            <div className="small">₹{food.price}</div>
          </div>
          <p className="small" style={{ marginTop: "0.5rem" }}>
            {food.category} • {food.type}
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "1rem",
              alignItems: "center",
            }}
          >
            <button onClick={() => setIsEditing(true)}>Edit</button>
            <button onClick={() => onDelete(food.id)}>Delete</button>
            {food.isBestSeller && (
              <span style={{ fontSize: "0.8rem", color: "var(--accent)" }}>
                Best Seller
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
