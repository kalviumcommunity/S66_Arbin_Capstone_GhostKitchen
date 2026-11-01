import { useState } from "react";
import FoodInventory from "./FoodInventory";
import Ingredients from "./Ingredients";

export default function OwnerInventory() {
  const [tab, setTab] = useState("ingredients");
  return <>
    <div className="inventory-tabs" aria-label="Inventory type"><button type="button" className={tab === "ingredients" ? "active" : ""} onClick={() => setTab("ingredients")}>Ingredients & usage</button><button type="button" className={tab === "foods" ? "active" : ""} onClick={() => setTab("foods")}>Sellable food portions</button></div>
    {tab === "ingredients" ? <Ingredients /> : <FoodInventory />}
  </>;
}
