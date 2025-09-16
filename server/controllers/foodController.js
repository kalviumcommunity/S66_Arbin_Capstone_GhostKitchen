// controllers/foodController.js

// Dummy food data
let foods = [
  { id: 1, name: "Paneer Butter Masala", category: "veg", price: 180, isBestSeller: true, type: "main" },
  { id: 2, name: "Chicken Biryani", category: "non-veg", price: 220, isBestSeller: true, type: "main" },
  { id: 3, name: "Gulab Jamun", category: "dessert", price: 90, isBestSeller: false, type: "dessert" },
];

// ------------------ GET APIs ------------------ //
export const getAllFoods = (req, res) => {
  try {
    res.status(200).json(foods);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch foods" });
  }
};

export const getFoodsByCategory = (req, res) => {
  try {
    const category = req.params.category;
    const result = foods.filter((food) => food.category === category);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch category foods" });
  }
};

export const getBestSellers = (req, res) => {
  try {
    const bestSellers = foods.filter((food) => food.isBestSeller);
    res.status(200).json(bestSellers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch best sellers" });
  }
};

export const getCombos = (req, res) => {
  try {
    const combos = foods.filter((food) => food.type === "combo");
    res.status(200).json(combos);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch combos" });
  }
};

// ------------------ POST API ------------------ //
export const addFoodItem = (req, res) => {
  try {
    const { name, category, price, isBestSeller, type } = req.body;
    if (!name || !category || !price || isBestSeller === undefined || !type) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newFood = {
      id: foods.length + 1,
      name,
      category,
      price,
      isBestSeller,
      type,
    };

    foods.push(newFood);
    res.status(201).json({ message: "Food item added successfully", food: newFood });
  } catch (err) {
    res.status(500).json({ error: "Failed to add food item" });
  }
};

// ------------------ PUT API ------------------ //
// ✅ NEW: Update a food item by ID
export const updateFoodItem = (req, res) => {
  try {
    const foodId = parseInt(req.params.id);
    const { name, category, price, isBestSeller, type } = req.body;

    const foodIndex = foods.findIndex((food) => food.id === foodId);
    if (foodIndex === -1) {
      return res.status(404).json({ error: "Food item not found" });
    }

    // Update fields only if provided
    if (name) foods[foodIndex].name = name;
    if (category) foods[foodIndex].category = category;
    if (price) foods[foodIndex].price = price;
    if (isBestSeller !== undefined) foods[foodIndex].isBestSeller = isBestSeller;
    if (type) foods[foodIndex].type = type;

    res.status(200).json({ message: "Food item updated successfully", food: foods[foodIndex] });
  } catch (err) {
    res.status(500).json({ error: "Failed to update food item" });
  }
};
