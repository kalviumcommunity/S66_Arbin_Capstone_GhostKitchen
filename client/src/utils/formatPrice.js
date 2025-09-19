export const formatPrice = (price) => {
  if (price === undefined || price === null) return "N/A";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(price);
};
