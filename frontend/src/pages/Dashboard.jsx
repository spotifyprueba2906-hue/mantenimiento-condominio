import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import {
    Wrench,
    Building2,
    CheckCircle,
    Clock,
    AlertTriangle,
    ArrowRight,
    Calendar
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function Dashboard() {
    const { user } = useAuth()
    const [stats, setStats] = useState(null)
    const [recentMaintenance, setRecentMaintenance] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        try {
            const [mantenimientosRes] = await Promise.all([
                api.get('/mantenimientos', { params: { limit: 5 } })
            ])

            setRecentMaintenance(mantenimientosRes.data.data)

            // Calcular estadísticas
            const total = mantenimientosRes.data.pagination.total
            const completados = mantenimientosRes.data.data.filter(m => m.estado === 'COMPLETADO').length
            const enProgreso = mantenimientosRes.data.data.filter(m => m.estado === 'EN_PROGRESO').length

            setStats({
                total,
                completados,
                enProgreso,
                pendientes: total - completados - enProgreso
            })
        } catch (error) {
            console.error('Error cargando dashboard:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const getStatusBadge = (estado) => {
        const config = {
            COMPLETADO: { class: 'badge-success', icon: CheckCircle, label: 'Completado' },
            EN_PROGRESO: { class: 'badge-warning', icon: Clock, label: 'En Progreso' },
            PENDIENTE: { class: 'badge-gray', icon: Clock, label: 'Pendiente' },
            CANCELADO: { class: 'badge-error', icon: AlertTriangle, label: 'Cancelado' }
        }
        const { class: cls, icon: Icon, label } = config[estado] || config.PENDIENTE
        return (
            <span className={`badge ${cls}`}>
                <Icon size={12} style={{ marginRight: 4 }} />
                {label}
            </span>
        )
    }

    if (isLoading) {
        return (
            <div className="loading-page" style={{ minHeight: 400 }}>
                <div className="spinner"></div>
                <p>Cargando dashboard...</p>
            </div>
        )
    }

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">
                    ¡Hola, {user?.nombre?.split(' ')[0]}! 👋
                </h1>
                <p className="dashboard-subtitle">
                    {user?.rol === 'ADMIN'
                        ? 'Bienvenido al panel de administración'
                        : `Departamento ${user?.departamento?.numero || ''}`}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon green">
                        <Wrench size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{stats?.total || 0}</div>
                        <div className="stat-label">Total Mantenimientos</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon blue">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{stats?.completados || 0}</div>
                        <div className="stat-label">Completados</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon orange">
                        <Clock size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{stats?.enProgreso || 0}</div>
                        <div className="stat-label">En Progreso</div>
                    </div>
                </div>
            </div>

            {/* Recent Maintenance */}
            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
                        Mantenimientos Recientes
                    </h2>
                    <Link to="/mantenimientos" className="btn btn-secondary btn-sm">
                        Ver todos
                        <ArrowRight size={16} />
                    </Link>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {recentMaintenance.length === 0 ? (
                        <div className="empty-state">
                            <Wrench size={48} className="empty-state-icon" />
                            <p className="empty-state-title">No hay mantenimientos</p>
                            <p>Los mantenimientos aparecerán aquí cuando se registren.</p>
                        </div>
                    ) : (
                        <div className="table-container" style={{ boxShadow: 'none' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Título</th>
                                        <th>Tipo</th>
                                        <th>Área</th>
                                        <th>Fecha</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentMaintenance.map(item => (
                                        <tr key={item.id}>
                                            <td>
                                                <Link
                                                    to={`/mantenimientos/${item.id}`}
                                                    style={{ fontWeight: 500, color: 'var(--color-gray-800)' }}
                                                >
                                                    {item.titulo}
                                                </Link>
                                            </td>
                                            <td>
                                                <span className="badge badge-info">{item.tipo}</span>
                                            </td>
                                            <td>
                                                {item.area === 'COMUN' ? (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <Building2 size={14} />
                                                        Área Común
                                                    </span>
                                                ) : (
                                                    <span>Depto {item.departamento?.numero}</span>
                                                )}
                                            </td>
                                            <td>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-gray-500)' }}>
                                                    <Calendar size={14} />
                                                    {format(new Date(item.fechaInicio), 'dd MMM yyyy', { locale: es })}
                                                </span>
                                            </td>
                                            <td>{getStatusBadge(item.estado)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
