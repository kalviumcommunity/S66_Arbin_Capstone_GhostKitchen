# Layouts

## Owner shell
- Source: `client/src/components/owner/OwnerLayout.jsx`
- Owner pages render inside a warm dashboard shell with a fixed left navigation rail, top utility header, and nested React Router outlet.

## Root application
- Source: `client/src/App.jsx`
- React Router selects public and protected pages. Owner routes are wrapped by `ProtectedRoute role="owner"` and `OwnerLayout`.
