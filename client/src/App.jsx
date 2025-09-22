import React from "react";
import FoodList from "./components/FoodList";

const initialFoods = [
  { id: 1, name: "Paneer Tikka", price: 199, category: "Veg", type: "Starter", isBestSeller: true },
  { id: 2, name: "Chicken Biryani", price: 299, category: "Non-Veg", type: "Main" },
  { id: 3, name: "Gulab Jamun", price: 99, category: "Dessert", type: "Sweet" }
];

export default function App() {
  return (
    <div className="container">
      <h1>Ghost Kitchen Menu</h1>
      <FoodList foods={initialFoods} /> 
    </div>
  );
}
