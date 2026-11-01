# Shared Components

The application uses custom React components and vanilla CSS rather than a component library.

## OwnerLayout
- Source: `client/src/components/owner/OwnerLayout.jsx`
- Shared owner shell with sidebar, header, breadcrumb, search, profile, and nested outlet.

```jsx
import { NavLink, Outlet, useLocation } from "react-router-dom";
// Full source is maintained in the repository; this discovery artifact records the shared shell.
```

## Primary Buttons
- Source: `client/src/App.css`
- `.primary-btn` is the shared orange action button; `.outline-btn` is the neutral secondary variant.
