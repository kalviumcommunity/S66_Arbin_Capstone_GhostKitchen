// Dummy data with one combo + sweet item added for consistency ✅
const foods = [
  { id: 1, name: 'Paneer Tikka', category: 'veg', price: 150, isBestSeller: true, type: 'combo' },
  { id: 2, name: 'Chicken Biryani', category: 'non-veg', price: 200, isBestSeller: true, type: 'main' },
  { id: 3, name: 'Gulab Jamun', category: 'dessert', price: 50, isBestSeller: false, type: 'sweet' },
  { id: 4, name: 'Veg Combo Meal', category: 'veg', price: 180, isBestSeller: false, type: 'combo' },
  { id: 5, name: 'Butter Chicken', category: 'non-veg', price: 220, isBestSeller: true, type: 'main' },
];

// ================== GET APIs ==================

// GET all foods
export const getAllFoods = (req, res) => {
  try {
    res.status(200).json(foods);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch foods' });
  }
};

// GET foods by category
export const getFoodsByCategory = (req, res) => {
  try {
    const category = req.params.cat;
    const filtered = foods.filter(food => food.category === category);

    if (filtered.length === 0) {
      return res.status(404).json({ message: `No foods found in category: ${category}` });
    }

    res.status(200).json(filtered);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch category items' });
  }
};

// GET bestsellers
export const getBestSellers = (req, res) => {
  try {
    const bestsellers = foods.filter(food => food.isBestSeller);

    if (bestsellers.length === 0) {
      return res.status(404).json({ message: 'No bestsellers found' });
    }

    res.status(200).json(bestsellers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bestsellers' });
  }
};

// GET combos
export const getCombos = (req, res) => {
  try {
    const combos = foods.filter(food => food.type === 'combo');

    if (combos.length === 0) {
      return res.status(404).json({ message: 'No combos found' });
    }

    res.status(200).json(combos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch combos' });
  }
};

// ================== POST API ==================
// Add new food item
export const addFoodItem = (req, res) => {
  try {
    let { name, category, price, isBestSeller, type } = req.body;

    // ✅ Coerce numeric strings to numbers
    if (price !== undefined) price = Number(price);

    // ✅ Strong validation
    if (
      typeof name !== 'string' ||
      typeof category !== 'string' ||
      isNaN(price) ||
      typeof type !== 'string'
    ) {
      return res.status(400).json({
        error: 'Invalid input. Ensure name/category/type are strings and price is a valid number.',
      });
    }

    const newFood = {
      id: foods.length + 1,
      name,
      category,
      price,
      isBestSeller: Boolean(isBestSeller), // ✅ Coerced to boolean
      type,
    };

    foods.push(newFood);
    res.status(201).json({ message: 'Food item added successfully', food: newFood });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add food item' });
  }
};

// ================== PUT API ==================
// Update existing food item
export const updateFoodItem = (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // ✅ ID validation
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid food ID' });
    }

    const foodIndex = foods.findIndex(food => food.id === id);
    if (foodIndex === -1) {
      return res.status(404).json({ error: 'Food item not found' });
    }

    let { name, category, price, isBestSeller, type } = req.body;
    const food = foods[foodIndex];

    // ✅ Ensure at least one valid field is provided
    if (
      name === undefined &&
      category === undefined &&
      price === undefined &&
      isBestSeller === undefined &&
      type === undefined
    ) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    // ✅ Validate and update fields only if correct type
    if (name !== undefined) {
      if (typeof name !== 'string') return res.status(400).json({ error: 'Invalid name' });
      food.name = name;
    }
    if (category !== undefined) {
      if (typeof category !== 'string') return res.status(400).json({ error: 'Invalid category' });
      food.category = category;
    }
    if (price !== undefined) {
      price = Number(price); // ✅ allow numeric strings
      if (isNaN(price)) return res.status(400).json({ error: 'Invalid price' });
      food.price = price;
    }
    if (isBestSeller !== undefined) {
      if (typeof isBestSeller !== 'boolean') {
        return res.status(400).json({ error: 'Invalid isBestSeller flag (must be boolean)' });
      }
      food.isBestSeller = isBestSeller;
    }
    if (type !== undefined) {
      if (typeof type !== 'string') return res.status(400).json({ error: 'Invalid type' });
      food.type = type;
    }

    res.status(200).json({ message: 'Food item updated successfully', food });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update food item' });
  }
};
