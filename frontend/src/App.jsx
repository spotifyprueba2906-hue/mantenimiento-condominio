import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

// Páginas
import Login from './pages/Login'
import CambiarPassword from './pages/CambiarPassword'
import Dashboard from './pages/Dashboard'
import Departamentos from './pages/Departamentos'
import Mantenimientos from './pages/Mantenimientos'
import MantenimientoDetalle from './pages/MantenimientoDetalle'
import AreasComunes from './pages/AreasComunes'
import Sugerencias from './pages/Sugerencias'
import SugerenciasAdmin from './pages/SugerenciasAdmin'
import Reportes from './pages/Reportes'

// Layouts
import DashboardLayout from './layouts/DashboardLayout'

// Componente para rutas protegidas
function PrivateRoute({ children, requireAdmin = false, requirePasswordChanged = true }) {
    const { user, isLoading } = useAuth()

    if (isLoading) {
        return (
            <div className="loading-page">
                <div className="spinner"></div>
                <p>Cargando...</p>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    // Si el propietario no ha cambiado su contraseña
    if (requirePasswordChanged && user.rol === 'PROPIETARIO' && !user.passwordCambiada) {
        return <Navigate to="/cambiar-password" replace />
    }

    // Si se requiere admin
    if (requireAdmin && user.rol !== 'ADMIN') {
        return <Navigate to="/dashboard" replace />
    }

    return children
}

function AppRoutes() {
    return (
        <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/areas-comunes" element={<AreasComunes />} />

            {/* Cambiar contraseña (propietarios nuevos) */}
            <Route
                path="/cambiar-password"
                element={
                    <PrivateRoute requirePasswordChanged={false}>
                        <CambiarPassword />
                    </PrivateRoute>
                }
            />

            {/* Rutas protegidas con layout */}
            <Route
                path="/"
                element={
                    <PrivateRoute>
                        <DashboardLayout />
                    </PrivateRoute>
                }
            >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="mantenimientos" element={<Mantenimientos />} />
                <Route path="mantenimientos/:id" element={<MantenimientoDetalle />} />
                <Route path="reportes" element={<Reportes />} />
                <Route path="sugerencias" element={<Sugerencias />} />
                <Route
                    path="departamentos"
                    element={
                        <PrivateRoute requireAdmin>
                            <Departamentos />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="admin/sugerencias"
                    element={
                        <PrivateRoute requireAdmin>
                            <SugerenciasAdmin />
                        </PrivateRoute>
                    }
                />
            </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            borderRadius: '12px',
                            padding: '16px',
                            fontSize: '14px'
                        },
                        success: {
                            iconTheme: {
                                primary: '#00B67A',
                                secondary: 'white'
                            }
                        },
                        error: {
                            iconTheme: {
                                primary: '#EF4444',
                                secondary: 'white'
                            }
                        }
                    }}
                />
            </AuthProvider>
        </BrowserRouter>
    )
}
