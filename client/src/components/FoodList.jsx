import React, { useState } from "react";
import FoodCard from "./FoodCard";

export default function FoodList({ foods: initialFoods }) {
  const [foods, setFoods] = useState(initialFoods);

  // ✅ FIX 2: Use functional updates
  const handleUpdate = (updatedFood) => {
    setFoods((prevFoods) =>
      prevFoods.map((f) => (f.id === updatedFood.id ? updatedFood : f))
    );
  };

  const handleDelete = (id) => {
    setFoods((prevFoods) => prevFoods.filter((f) => f.id !== id));
  };

  return (
    <div className="food-list">
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
