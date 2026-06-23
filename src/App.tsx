import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
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
        ],
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
