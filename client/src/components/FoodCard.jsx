import React, { useState } from 'react';
import { formatPrice } from '../utils/formatPrice';

export default function FoodCard({ food, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFood, setEditedFood] = useState({ ...food });

  const handleSave = () => {
    onUpdate(editedFood); // send updated food back to parent
    setIsEditing(false);
  };

  return (
    <div className="card">
      {isEditing ? (
        <>
          <input
            type="text"
            value={editedFood.name}
            onChange={(e) => setEditedFood({ ...editedFood, name: e.target.value })}
          />
          <input
            type="number"
            value={editedFood.price}
            onChange={(e) => setEditedFood({ ...editedFood, price: Number(e.target.value) })}
          />
          <button className="button" onClick={handleSave}>Save</button>
          <button className="button" onClick={() => setIsEditing(false)}>Cancel</button>
        </>
      ) : (
        <>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <h3 style={{margin:0}}>{food.name}</h3>
            <div className="small">{formatPrice(food.price)}</div>
          </div>
          <p className="small" style={{marginTop:'0.5rem'}}>
            {food.category} • {food.type}
          </p>
          <div style={{display:'flex', justifyContent:'space-between', marginTop:'1rem', alignItems:'center'}}>
            <div>
              <button className="button" onClick={() => setIsEditing(true)}>Edit</button>
              <button className="button" onClick={() => onDelete(food.id)} style={{marginLeft:'0.5rem', backgroundColor:'red'}}>Delete</button>
            </div>
            {food.isBestSeller && (
              <span style={{fontSize:'0.8rem', color:'var(--accent)'}}>Best Seller</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
