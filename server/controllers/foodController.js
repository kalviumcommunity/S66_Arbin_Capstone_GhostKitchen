// Existing Dummy Data
const foods = [
  { id: 1, name: 'Paneer Tikka', category: 'veg', price: 150, isBestSeller: true, type: 'combo' },
  { id: 2, name: 'Chicken Biryani', category: 'non-veg', price: 200, isBestSeller: true, type: 'main' },
  { id: 3, name: 'Gulab Jamun', category: 'dessert', price: 50, isBestSeller: false, type: 'sweet' },
  { id: 4, name: 'Veg Combo Meal', category: 'veg', price: 180, isBestSeller: false, type: 'combo' },
  { id: 5, name: 'Butter Chicken', category: 'non-veg', price: 220, isBestSeller: true, type: 'main' },
];

// ===================== OLD GET APIs =====================
export const getAllFoods = (req, res) => {
  try {
    res.status(200).json(foods);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch foods' });
  }
};

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

// ===================== NEW POST API =====================
export const addFoodItem = (req, res) => {
  try {
    const { name, category, price, isBestSeller, type } = req.body;

    if (!name || !category || !price || !type) {
      return res.status(400).json({ message: 'Missing required food fields' });
    }

    const newFood = {
      id: foods.length + 1,
      name,
      category,
      price,
      isBestSeller: isBestSeller || false,
      type
    };

    foods.push(newFood); // Just push to dummy array
    res.status(201).json({ message: 'Food item added successfully', food: newFood });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add food item' });
  }
};
