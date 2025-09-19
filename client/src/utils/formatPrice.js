// frontend/src/utils/formatPrice.js
export const formatPrice = (price) => {
  if (price === undefined || price === null) return "N/A"; // safeguard
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(price);
};
