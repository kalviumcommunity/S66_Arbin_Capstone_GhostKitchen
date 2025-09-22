import React from 'react';
import FoodList from './components/FoodList';

function App() {
  const foods = [
    { id: 1, name: "Paneer Tikka", category: "Veg", type: "Starter", price: 199, isBestSeller: true },
    { id: 2, name: "Chicken Biryani", category: "Non-Veg", type: "Main", price: 299, isBestSeller: false },
    { id: 3, name: "Gulab Jamun", category: "Dessert", type: "Sweet", price: 99, isBestSeller: false },
  ];

  return (
    <div style={{padding: '2rem'}}>
      <h1>Ghost Kitchen Menu</h1>
      <FoodList initialFoods={foods} />
    </div>
  );
}

export default App;
