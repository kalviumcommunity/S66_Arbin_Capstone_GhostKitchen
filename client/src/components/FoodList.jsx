import React from 'react';
import FoodCard from './FoodCard';

export default function FoodList({ foods }) {
  return (
    <div style={{display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))'}}>
      {foods.map((food) => (
        <FoodCard key={food.id} food={food} />
      ))}
    </div>
  );
}
