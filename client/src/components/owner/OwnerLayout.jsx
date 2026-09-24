import { NavLink, Outlet } from "react-router-dom";

const Icon = ({ name }) => {
  const paths = {
    grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
    bag: "M6 8V6a6 6 0 0 1 12 0v2M4 8h16l-1 12H5L4 8Z",
    chat: "M5 5h14v10H9l-4 4V5Z",
    calendar: "M5 4v3M19 4v3M4 9h16M6 3h12a2 2 0 0 1 2 2v14H4V5a2 2 0 0 1 2-2Z",
    utensils: "M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3v18M14 3v5a3 3 0 0 0 3 3",
    box: "M4 7 12 3l8 4v10l-8 4-8-4V7ZM4 7l8 4 8-4M12 11v10",
    clipboard: "M8 5h8M9 3h6v4H9zM6 5H4v16h16V5h-2M8 12h8M8 16h5",
    star: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-3-5.5 3 1-6.2L3.5 9.6l6.2-.9L12 3Z",
    settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-5v2m0 14v2m9-9h-2M5 12H3m15.4-6.4-1.4 1.4M7 17l-1.4 1.4m12.8 0L17 17M7 7 5.6 5.6",
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]} /></svg>;
};

const navItems = [
  ["Dashboard", "/owner/dashboard", "grid"], ["Orders", "/owner/orders", "bag"],
  ["Messages", "/owner/dashboard", "chat"], ["Calendar", "/owner/dashboard", "calendar"],
  ["Menu", "/owner/foods", "utensils"], ["Inventory", "/owner/inventory", "box"],
  ["Purchase Orders", "/owner/dashboard", "clipboard"], ["Reviews", "/owner/reviews", "star"],
];

const linkClass = ({ isActive }) => `owner-nav-item ${isActive ? "is-active" : ""}`;

export default function OwnerLayout() {
  return (
    <section className="owner-shell">
      <aside className="owner-sidebar">
        <div className="owner-brand"><span className="owner-brand-mark">H</span><span>Hearth<span>&</span>Table</span></div>
        <div className="owner-venue"><span className="venue-dot" /><span><b>Downtown Kitchen</b><small>Open · Closes 11:00 PM</small></span><span className="chevron">⌄</span></div>
        <p className="owner-nav-label">Workspace</p>
        <nav className="owner-nav">{navItems.map(([label, to, icon]) => <NavLink key={label} to={to} className={linkClass}><Icon name={icon} /><span>{label}</span>{label === "Orders" ? <em>12</em> : null}</NavLink>)}</nav>
        <div className="owner-sidebar-bottom"><NavLink to="/owner/dashboard" className="owner-nav-item"><Icon name="settings" /><span>Settings</span></NavLink><div className="owner-help"><b>Need a hand?</b><span>Visit the help center</span><button type="button">Open help center ↗</button></div></div>
      </aside>

      <div className="owner-content">
        <header className="owner-header"><div className="owner-breadcrumb"><span>Workspace</span><b>/</b><strong>Dashboard</strong></div><div className="owner-header-actions"><label className="owner-search"><span>⌕</span><input aria-label="Search dashboard" placeholder="Search anything..." /></label><button className="header-icon" aria-label="Notifications" type="button">♢<i /></button><button className="header-icon" aria-label="Settings" type="button"><Icon name="settings" /></button><div className="profile"><span className="profile-avatar">AM</span><span><b>Alex Morgan</b><small>Administrator</small></span><span className="chevron">⌄</span></div></div></header>
        <Outlet />
      </div>
    </section>
  );
}
