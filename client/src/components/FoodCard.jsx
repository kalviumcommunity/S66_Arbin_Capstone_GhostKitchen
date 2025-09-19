import React from 'react';

export default function FoodCard({ food }) {
  return (
    <div className="card">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h3 style={{margin:0}}>{food.name}</h3>
        <div className="small">₹{food.price}</div>
      </div>
      <p className="small" style={{marginTop:'0.5rem'}}>{food.category} • {food.type}</p>
      <div style={{display:'flex', justifyContent:'space-between', marginTop:'1rem', alignItems:'center'}}>
        <button className="button">Add</button>
        {food.isBestSeller && <span style={{fontSize:'0.8rem', color:'var(--accent)'}}>Best Seller</span>}
      </div>
    </div>
  );
}
