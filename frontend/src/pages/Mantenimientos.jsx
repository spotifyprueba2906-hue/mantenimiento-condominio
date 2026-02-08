import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import {
    Plus,
    Search,
    Filter,
    Calendar,
    Building2,
    Image as ImageIcon,
    CheckCircle,
    Clock,
    AlertTriangle
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function Mantenimientos() {
    const { user } = useAuth()
    const [mantenimientos, setMantenimientos] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [filters, setFilters] = useState({ tipo: '', area: '', estado: '' })
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })

    useEffect(() => {
        loadMantenimientos()
    }, [filters, pagination.page])

    const loadMantenimientos = async () => {
        try {
            const params = {
                page: pagination.page,
                limit: 12,
                ...filters
            }
            Object.keys(params).forEach(k => !params[k] && delete params[k])

            const response = await api.get('/mantenimientos', { params })
            setMantenimientos(response.data.data)
            setPagination(prev => ({
                ...prev,
                totalPages: response.data.pagination.totalPages
            }))
        } catch (error) {
            toast.error('Error cargando mantenimientos')
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

    const filteredMantenimientos = mantenimientos.filter(m =>
        m.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div>
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 className="dashboard-title">Mantenimientos</h1>
                    <p className="dashboard-subtitle">Gestiona los mantenimientos del condominio</p>
                </div>
                {user?.rol === 'ADMIN' && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={20} />
                        Nuevo Mantenimiento
                    </button>
                )}
            </div>

            {/* Filtros */}
            <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="card-body" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }} />
                        <input
                            type="text"
                            placeholder="Buscar mantenimientos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-input"
                            style={{ paddingLeft: 40 }}
                        />
                    </div>

                    <select
                        value={filters.tipo}
                        onChange={(e) => setFilters(p => ({ ...p, tipo: e.target.value }))}
                        className="form-input"
                        style={{ width: 'auto' }}
                    >
                        <option value="">Todos los tipos</option>
                        <option value="SEMANAL">Semanal</option>
                        <option value="MENSUAL">Mensual</option>
                        <option value="EMERGENCIA">Emergencia</option>
                    </select>

                    <select
                        value={filters.area}
                        onChange={(e) => setFilters(p => ({ ...p, area: e.target.value }))}
                        className="form-input"
                        style={{ width: 'auto' }}
                    >
                        <option value="">Todas las áreas</option>
                        <option value="COMUN">Áreas Comunes</option>
                        <option value="DEPARTAMENTO">Departamentos</option>
                    </select>

                    <select
                        value={filters.estado}
                        onChange={(e) => setFilters(p => ({ ...p, estado: e.target.value }))}
                        className="form-input"
                        style={{ width: 'auto' }}
                    >
                        <option value="">Todos los estados</option>
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="EN_PROGRESO">En Progreso</option>
                        <option value="COMPLETADO">Completado</option>
                    </select>
                </div>
            </div>

            {/* Grid de mantenimientos */}
            {isLoading ? (
                <div className="loading-page" style={{ minHeight: 300 }}>
                    <div className="spinner"></div>
                </div>
            ) : filteredMantenimientos.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <Filter size={48} className="empty-state-icon" />
                        <p className="empty-state-title">No hay mantenimientos</p>
                        <p>No se encontraron mantenimientos con los filtros seleccionados.</p>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--spacing-6)' }}>
                    {filteredMantenimientos.map(item => (
                        <Link
                            key={item.id}
                            to={`/mantenimientos/${item.id}`}
                            className="card"
                            style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                            {/* Imagen de preview */}
                            <div style={{
                                height: 160,
                                background: 'linear-gradient(135deg, var(--color-gray-100), var(--color-gray-200))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden'
                            }}>
                                {item.imagenes?.[0] ? (
                                    <img
                                        src={item.imagenes[0].urlCloudinary}
                                        alt={item.titulo}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <ImageIcon size={48} style={{ color: 'var(--color-gray-300)' }} />
                                )}
                            </div>

                            <div className="card-body">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <span className="badge badge-info">{item.tipo}</span>
                                    {getStatusBadge(item.estado)}
                                </div>

                                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 8 }}>
                                    {item.titulo}
                                </h3>

                                <p style={{ color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)', marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {item.descripcion}
                                </p>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-400)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Calendar size={14} />
                                        {format(new Date(item.fechaInicio), 'dd MMM yyyy', { locale: es })}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        {item.area === 'COMUN' ? (
                                            <>
                                                <Building2 size={14} />
                                                Área Común
                                            </>
                                        ) : (
                                            `Depto ${item.departamento?.numero}`
                                        )}
                                    </span>
                                </div>

                                {item._count?.imagenes > 0 && (
                                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-gray-400)', fontSize: 'var(--font-size-xs)' }}>
                                        <ImageIcon size={12} />
                                        {item._count.imagenes} imagen{item._count.imagenes > 1 ? 'es' : ''}
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Paginación */}
            {pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 'var(--spacing-8)' }}>
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            onClick={() => setPagination(p => ({ ...p, page }))}
                            className={`btn ${page === pagination.page ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                        >
                            {page}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
