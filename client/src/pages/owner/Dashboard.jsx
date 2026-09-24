import { useState } from "react";

const Icon = ({ children }) => <span className="metric-icon">{children}</span>;

const stats = [
  { label: "Total Orders", value: "1,248", change: "+12.5%", note: "vs last month", icon: "↗", tone: "orange" },
  { label: "Total Customers", value: "8,642", change: "+8.2%", note: "vs last month", icon: "♙", tone: "blue" },
  { label: "Total Revenue", value: "$48,290", change: "+15.8%", note: "vs last month", icon: "$", tone: "green" },
  { label: "Pending Orders", value: "24", change: "-3.1%", note: "vs last month", icon: "◷", tone: "purple", negative: true },
];

const menuItems = [
  ["Truffle Mushroom Pasta", "Pasta", "$18.00", "4.9", "342", "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=160&q=80", "Chef's pick"],
  ["Crispy Chicken Burger", "Burgers", "$14.50", "4.8", "289", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=160&q=80", "Popular"],
  ["Salmon Avocado Bowl", "Healthy", "$16.00", "4.7", "214", "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=160&q=80", ""],
];

const orders = [
  ["#GH-48291", "Olivia Bennett", "Truffle Mushroom Pasta", "2", "$36.00", "Dine-in", "Completed"],
  ["#GH-48290", "Ethan Carter", "Crispy Chicken Burger", "1", "$14.50", "Takeaway", "On Process"],
  ["#GH-48289", "Sophia Wilson", "Salmon Avocado Bowl", "2", "$32.00", "Online", "Completed"],
  ["#GH-48288", "James Anderson", "Margherita Pizza", "1", "$15.00", "Dine-in", "Cancelled"],
  ["#GH-48287", "Mia Thompson", "Chocolate Lava Cake", "3", "$21.00", "Online", "Completed"],
];

const reviews = [
  ["https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=140&q=80", "Truffle Mushroom Pasta", "Nora Patel", "Absolutely delicious. The sauce was so rich and creamy!", "2 hours ago"],
  ["https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=140&q=80", "Crispy Chicken Burger", "Daniel Kim", "Best burger I've had in the city. The crunch is perfect.", "Yesterday"],
  ["https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=140&q=80", "Salmon Avocado Bowl", "Grace Lee", "Fresh, colorful, and filling. Will definitely order again.", "2 days ago"],
];

function RevenueChart() {
  const points = "0,135 40,116 80,122 120,93 160,101 200,69 240,82 280,56 320,68 360,31 400,44 440,17 480,34 520,3";
  return <div className="revenue-graph"><div className="chart-y"><span>$12k</span><span>$8k</span><span>$4k</span><span>$0</span></div><svg viewBox="0 0 520 150" preserveAspectRatio="none" role="img" aria-label="Revenue and expenses line chart"><defs><linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f47b3c" stopOpacity=".25" /><stop offset="1" stopColor="#f47b3c" stopOpacity="0" /></linearGradient></defs><path d={`M ${points} L 520 150 L 0 150 Z`} fill="url(#revenueFill)" /><path d={`M ${points}`} fill="none" stroke="#e96d32" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><path d="M 0,139 40,130 80,135 120,117 160,123 200,107 240,112 280,98 320,103 360,88 400,96 440,77 480,83 520,71" fill="none" stroke="#c8c1ba" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" /></svg><div className="chart-x"><span>May 01</span><span>May 07</span><span>May 14</span><span>May 21</span><span>May 28</span></div></div>;
}

export default function OwnerDashboard() {
  const [range, setRange] = useState("This month");
  const [activeDay, setActiveDay] = useState("Sat");
  return <div className="dashboard-page">
    <div className="page-heading"><div><h1>Dashboard <span className="live-pill"><i /> Live</span></h1><p>Here’s what’s happening at Hearth & Table today.</p></div><div className="heading-actions"><button className="outline-btn" type="button">↓ <span>Export report</span></button><button className="primary-btn" type="button">＋ New order</button></div></div>

    <section className="stats-grid">{stats.map((stat) => <article className="stat-card" key={stat.label}><div className="stat-top"><span>{stat.label}</span><Icon>{stat.icon}</Icon></div><strong>{stat.value}</strong><div className={`stat-change ${stat.negative ? "is-negative" : ""}`}><b>{stat.change}</b><span>{stat.note}</span></div></article>)}</section>

    <section className="analytics-grid"><article className="panel revenue-panel"><div className="panel-head"><div><h2>Revenue analytics</h2><p>Track income and expenses over time</p></div><select value={range} onChange={(e) => setRange(e.target.value)} aria-label="Revenue date range"><option>This month</option><option>Last month</option><option>This year</option></select></div><div className="revenue-total"><strong>$48,290.00</strong><span className="positive">+15.8%</span><small>vs $41,680 last month</small></div><RevenueChart /><div className="chart-legend"><span><i className="legend-income" /> Income</span><span><i className="legend-expense" /> Expenses</span></div></article><article className="panel category-panel"><div className="panel-head"><div><h2>Food categories</h2><p>Sales distribution by category</p></div><button className="dots" type="button">•••</button></div><div className="donut-wrap"><div className="donut"><div><strong>1,248</strong><small>Total orders</small></div></div><div className="category-list"><span><i style={{ background: "#e96d32" }} />Chicken <b>28%</b></span><span><i style={{ background: "#f2b66a" }} />Seafood <b>22%</b></span><span><i style={{ background: "#8bb8a6" }} />Pasta <b>20%</b></span><span><i style={{ background: "#a99aee" }} />Burgers <b>18%</b></span><span><i style={{ background: "#ddd0bd" }} />Desserts <b>12%</b></span></div></div></article></section>

    <section className="analytics-grid lower-analytics"><article className="panel orders-panel"><div className="panel-head"><div><h2>Orders overview</h2><p>Daily order volume for this week</p></div><select aria-label="Orders date range"><option>This week</option><option>Last week</option></select></div><div className="bar-chart">{[["Mon",58],["Tue",76],["Wed",52],["Thu",84],["Fri",68],["Sat",100],["Sun",72]].map(([day, height]) => <button key={day} className={activeDay === day ? "bar-day active" : "bar-day"} onClick={() => setActiveDay(day)} type="button"><span className="bar-value">{Math.round(height * .3 + 12)}</span><i style={{ height: `${height}%` }} /><small>{day}</small></button>)}</div></article><article className="panel types-panel"><div className="panel-head"><div><h2>Order types</h2><p>How guests are ordering today</p></div><button className="dots" type="button">•••</button></div><div className="type-list"><div><span className="type-icon dine">⌂</span><span className="type-copy"><b>Dine-in</b><small>524 orders</small></span><strong>42%</strong><div className="progress"><i style={{ width: "42%" }} /></div></div><div><span className="type-icon take">↗</span><span className="type-copy"><b>Takeaway</b><small>375 orders</small></span><strong>30%</strong><div className="progress"><i style={{ width: "30%" }} /></div></div><div><span className="type-icon online">⌁</span><span className="type-copy"><b>Online</b><small>349 orders</small></span><strong>28%</strong><div className="progress"><i style={{ width: "28%" }} /></div></div></div></article></section>

    <section className="section-row"><div className="section-title"><div><h2>Trending menu items</h2><p>Your guests’ favorites this week</p></div><button className="text-btn" type="button">View menu <span>→</span></button></div><div className="menu-grid">{menuItems.map((item) => <article className="menu-card" key={item[0]}><img src={item[5]} alt="" /><div className="menu-card-content"><div className="menu-meta"><span>{item[1]}</span>{item[6] ? <em>{item[6]}</em> : null}</div><h3>{item[0]}</h3><div className="menu-detail"><span>★ {item[3]} <small>({item[4]})</small></span><b>{item[2]}</b></div></div></article>)}</div></section>

    <section className="panel recent-panel"><div className="section-title"><div><h2>Recent orders</h2><p>Latest activity from your restaurant</p></div><button className="text-btn" type="button">View all orders <span>→</span></button></div><div className="table-scroll"><table><thead><tr>{["Order ID", "Customer", "Menu item", "Qty", "Amount", "Order type", "Status"].map((head) => <th key={head}>{head}</th>)}</tr></thead><tbody>{orders.map((order) => <tr key={order[0]}>{order.map((cell, i) => <td key={cell}>{i === 0 ? <b className="order-id">{cell}</b> : i === 6 ? <span className={`status status-${cell.toLowerCase().replace(" ", "-")}`}>{cell}</span> : cell}</td>)}</tr>)}</tbody></table></div></section>

    <section className="section-row reviews-section"><div className="section-title"><div><h2>Customer reviews</h2><p>What guests are saying about you</p></div><button className="text-btn" type="button">View all reviews <span>→</span></button></div><div className="reviews-grid">{reviews.map((review) => <article className="review-card" key={review[2]}><div className="review-top"><img src={review[0]} alt="" /><div><b>{review[1]}</b><span>★★★★★ <small>5.0</small></span></div></div><p>“{review[3]}”</p><div className="review-foot"><b>{review[2]}</b><span>{review[4]}</span></div></article>)}</div></section>
  </div>;
}
