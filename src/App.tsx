import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProductListPage } from './pages/products/ProductListPage'
import { ProductNewPage } from './pages/products/ProductNewPage'
import { ProductEditPage } from './pages/products/ProductEditPage'
import { ProtectedRoute } from './router/ProtectedRoute'
import { GuestRoute } from './router/GuestRoute'
import { AdminShell } from './components/layout/AdminShell'

const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminShell />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/products', element: <ProductListPage /> },
          { path: '/products/new', element: <ProductNewPage /> },
          { path: '/products/:id/edit', element: <ProductEditPage /> },
        ],
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
