import React, { useState } from "react";
import FoodCard from "./FoodCard";

export default function FoodList({ foods: initialFoods = [] }) {
  const [foods, setFoods] = useState(initialFoods);

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
      {foods.length > 0 ? (
        foods.map((food) => (
          <FoodCard
            key={food.id}
            food={food}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))
      ) : (
        <p>No food items available.</p> 
      )}
    </div>
  );
}
