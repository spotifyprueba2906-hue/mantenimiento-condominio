import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import {
    Building2,
    Calendar,
    CheckCircle,
    Clock,
    Wrench,
    ArrowRight,
    Image as ImageIcon,
    LogIn
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function AreasComunes() {
    const [mantenimientos, setMantenimientos] = useState([])
    const [resumen, setResumen] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [filtroTipo, setFiltroTipo] = useState('')

    useEffect(() => {
        loadData()
    }, [filtroTipo])

    const loadData = async () => {
        try {
            const params = filtroTipo ? { tipo: filtroTipo } : {}
            const [mantsRes, resumenRes] = await Promise.all([
                api.get('/public/mantenimientos', { params }),
                api.get('/public/resumen')
            ])
            setMantenimientos(mantsRes.data.data || [])
            setResumen(resumenRes.data.data || null)
        } catch (error) {
            console.error('Error cargando datos:', error)
            setMantenimientos([])
        } finally {
            setIsLoading(false)
        }
    }


    const getStatusBadge = (estado) => {
        const config = {
            COMPLETADO: { class: 'badge-success', icon: CheckCircle, label: 'Completado' },
            EN_PROGRESO: { class: 'badge-warning', icon: Clock, label: 'En Progreso' }
        }
        const { class: cls, icon: Icon, label } = config[estado] || config.COMPLETADO
        return (
            <span className={`badge ${cls}`}>
                <Icon size={12} style={{ marginRight: 4 }} />
                {label}
            </span>
        )
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-gray-50)' }}>
            {/* Header */}
            <header className="navbar">
                <div className="container navbar-container">
                    <div className="navbar-brand">
                        <svg viewBox="0 0 100 100" style={{ width: 40, height: 40 }}>
                            <defs>
                                <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: '#00B67A' }} />
                                    <stop offset="100%" style={{ stopColor: '#0EA5E9' }} />
                                </linearGradient>
                            </defs>
                            <circle cx="50" cy="50" r="45" fill="url(#headerGrad)" />
                            <text x="50" y="62" fontFamily="Inter, sans-serif" fontSize="32" fontWeight="bold" fill="white" textAnchor="middle">G</text>
                        </svg>
                        <span>Grupo Ingcor</span>
                    </div>
                    <Link to="/login" className="btn btn-primary">
                        <LogIn size={18} />
                        Iniciar Sesión
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <section style={{
                background: 'linear-gradient(135deg, rgba(0,182,122,0.1) 0%, rgba(14,165,233,0.1) 100%)',
                padding: 'var(--spacing-12) 0'
            }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: 'var(--font-size-4xl)', fontWeight: 700, marginBottom: 'var(--spacing-4)' }}>
                        Mantenimiento de <span style={{ color: 'var(--color-primary)' }}>Áreas Comunes</span>
                    </h1>
                    <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-gray-600)', maxWidth: 600, margin: '0 auto' }}>
                        Consulta el historial de mantenimientos realizados en las áreas comunes del condominio.
                    </p>
                </div>
            </section>

            {/* Stats */}
            {resumen && (
                <section className="container" style={{ marginTop: 'calc(-1 * var(--spacing-6))' }}>
                    <div className="stats-grid" style={{ maxWidth: 800, margin: '0 auto' }}>
                        <div className="stat-card">
                            <div className="stat-icon green">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <div className="stat-value">{resumen.estadisticas?.completado || 0}</div>
                                <div className="stat-label">Completados</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon orange">
                                <Clock size={24} />
                            </div>
                            <div>
                                <div className="stat-value">{resumen.estadisticas?.en_progreso || 0}</div>
                                <div className="stat-label">En Progreso</div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Filtros */}
            <section className="container" style={{ marginTop: 'var(--spacing-8)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)', flexWrap: 'wrap', gap: 16 }}>
                    <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600 }}>
                        <Wrench size={24} style={{ marginRight: 8, color: 'var(--color-primary)' }} />
                        Historial de Mantenimientos
                    </h2>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            onClick={() => setFiltroTipo('')}
                            className={`btn ${!filtroTipo ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setFiltroTipo('SEMANAL')}
                            className={`btn ${filtroTipo === 'SEMANAL' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                        >
                            Semanal
                        </button>
                        <button
                            onClick={() => setFiltroTipo('MENSUAL')}
                            className={`btn ${filtroTipo === 'MENSUAL' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                        >
                            Mensual
                        </button>
                    </div>
                </div>

                {/* Lista */}
                {isLoading ? (
                    <div className="loading-page" style={{ minHeight: 300 }}>
                        <div className="spinner"></div>
                    </div>
                ) : mantenimientos.length === 0 ? (
                    <div className="card">
                        <div className="empty-state">
                            <Building2 size={48} className="empty-state-icon" />
                            <p className="empty-state-title">No hay mantenimientos</p>
                            <p>Los mantenimientos de áreas comunes aparecerán aquí.</p>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--spacing-6)' }}>
                        {mantenimientos.map(item => (
                            <div key={item.id} className="card">
                                {/* Imagen de preview */}
                                <div style={{
                                    height: 200,
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
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                        <span className="badge badge-info">{item.tipo}</span>
                                        {getStatusBadge(item.estado)}
                                    </div>

                                    <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, marginBottom: 8 }}>
                                        {item.titulo}
                                    </h3>

                                    <p style={{ color: 'var(--color-gray-600)', fontSize: 'var(--font-size-sm)', marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {item.descripcion}
                                    </p>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>
                                            <Calendar size={16} />
                                            {format(new Date(item.fechaInicio), 'dd MMMM yyyy', { locale: es })}
                                        </span>
                                        {item.imagenes?.length > 1 && (
                                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>
                                                +{item.imagenes.length - 1} fotos más
                                            </span>
                                        )}
                                    </div>

                                    {/* Galería de imágenes */}
                                    {item.imagenes?.length > 1 && (
                                        <div style={{
                                            marginTop: 16,
                                            display: 'flex',
                                            gap: 8,
                                            overflowX: 'auto',
                                            paddingBottom: 8
                                        }}>
                                            {item.imagenes.slice(1, 5).map(img => (
                                                <img
                                                    key={img.id}
                                                    src={img.urlCloudinary}
                                                    alt=""
                                                    style={{
                                                        width: 60,
                                                        height: 60,
                                                        objectFit: 'cover',
                                                        borderRadius: 'var(--radius-md)',
                                                        flexShrink: 0
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Footer */}
            <footer style={{
                marginTop: 'var(--spacing-12)',
                padding: 'var(--spacing-8) 0',
                background: 'var(--color-gray-800)',
                color: 'var(--color-gray-400)',
                textAlign: 'center'
            }}>
                <div className="container">
                    <p>© {new Date().getFullYear()} Grupo Ingcor - Mantenimiento Integral para Edificios</p>
                    <p style={{ marginTop: 8, fontSize: 'var(--font-size-sm)' }}>
                        Sistema de Gestión de Mantenimiento
                    </p>
                </div>
            </footer>
        </div>
    )
}
