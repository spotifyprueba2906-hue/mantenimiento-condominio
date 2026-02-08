import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    LayoutDashboard,
    Building2,
    Wrench,
    LogOut,
    Users,
    Menu,
    X,
    FileText,
    MessageSquare
} from 'lucide-react'
import { useState } from 'react'

export default function DashboardLayout() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    const navItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/mantenimientos', icon: Wrench, label: 'Mantenimientos' },
        { to: '/reportes', icon: FileText, label: 'Reportes PDF' },
    ]

    // Propietarios pueden enviar sugerencias
    if (user?.rol === 'PROPIETARIO') {
        navItems.push({ to: '/sugerencias', icon: MessageSquare, label: 'Sugerencias' })
    }

    // Solo admin ve departamentos y lista de sugerencias
    if (user?.rol === 'ADMIN') {
        navItems.push({ to: '/departamentos', icon: Building2, label: 'Departamentos' })
        navItems.push({ to: '/admin/sugerencias', icon: MessageSquare, label: 'Buzón Sugerencias' })
    }

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <div className="navbar-brand">
                        <svg viewBox="0 0 100 100" style={{ width: 40, height: 40 }}>
                            <defs>
                                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: '#00B67A' }} />
                                    <stop offset="100%" style={{ stopColor: '#0EA5E9' }} />
                                </linearGradient>
                            </defs>
                            <circle cx="50" cy="50" r="45" fill="url(#logoGrad)" />
                            <text x="50" y="62" fontFamily="Inter, sans-serif" fontSize="32" fontWeight="bold" fill="white" textAnchor="middle">G</text>
                        </svg>
                        <span>Grupo Ingcor</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div style={{ marginTop: 'auto', padding: 'var(--spacing-4)' }}>
                    <div style={{
                        padding: 'var(--spacing-4)',
                        background: 'var(--color-gray-50)',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: 'var(--spacing-4)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                            <div style={{
                                width: 36,
                                height: 36,
                                borderRadius: 'var(--radius-full)',
                                background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: 'var(--font-size-sm)'
                            }}>
                                {user?.nombre?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                                <p style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>{user?.nombre}</p>
                                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
                                    {user?.rol === 'ADMIN' ? 'Administrador' : 'Propietario'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%' }}>
                        <LogOut size={18} />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Mobile header */}
            <header className="mobile-header" style={{
                display: 'none',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: 60,
                background: 'white',
                borderBottom: '1px solid var(--color-gray-200)',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 var(--spacing-4)',
                zIndex: 99
            }}>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    style={{ background: 'none', border: 'none', padding: 8 }}
                >
                    {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <span style={{ fontWeight: 600 }}>Grupo Ingcor</span>
                <div style={{ width: 40 }} />
            </header>

            {/* Main content */}
            <main className="main-content">
                <Outlet />
            </main>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 98,
                        display: 'none'
                    }}
                />
            )}

            <style>{`
        @media (max-width: 768px) {
          .mobile-header { display: flex !important; }
          .main-content { padding-top: 76px !important; }
          .sidebar + div { display: block !important; }
        }
      `}</style>
        </div>
    )
}
