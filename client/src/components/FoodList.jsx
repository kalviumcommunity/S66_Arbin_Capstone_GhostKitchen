import React, { useState } from 'react';
import FoodCard from './FoodCard';

export default function FoodList({ initialFoods }) {
  const [foods, setFoods] = useState(initialFoods);

  const handleUpdate = (updatedFood) => {
    setFoods(foods.map((food) => food.id === updatedFood.id ? updatedFood : food));
  };

  const handleDelete = (id) => {
    setFoods(foods.filter((food) => food.id !== id));
  };

  return (
    <div style={{
      display: 'grid',
      gap: '1rem',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))'
    }}>
      {foods.map((food) => (
        <FoodCard
          key={food.id}
          food={food}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
