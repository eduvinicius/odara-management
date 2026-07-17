import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProductListPage } from './pages/products/ProductListPage'
import { ProductNewPage } from './pages/products/ProductNewPage'
import { ProductEditPage } from './pages/products/ProductEditPage'
import { CategoryListPage } from './pages/categories/CategoryListPage'
import { CategoryNewPage } from './pages/categories/CategoryNewPage'
import { CategoryEditPage } from './pages/categories/CategoryEditPage'
import { FeedbackListPage } from './pages/feedbacks/FeedbackListPage'
import { FeedbackNewPage } from './pages/feedbacks/FeedbackNewPage'
import { FeedbackEditPage } from './pages/feedbacks/FeedbackEditPage'
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
          { path: '/categories', element: <CategoryListPage /> },
          { path: '/categories/new', element: <CategoryNewPage /> },
          { path: '/categories/:id/edit', element: <CategoryEditPage /> },
          { path: '/feedbacks', element: <FeedbackListPage /> },
          { path: '/feedbacks/new', element: <FeedbackNewPage /> },
          { path: '/feedbacks/:id/edit', element: <FeedbackEditPage /> },
        ],
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
