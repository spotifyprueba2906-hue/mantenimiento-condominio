import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import {
    FileText,
    Download,
    Calendar,
    Building2,
    RefreshCw,
    Plus,
    Trash2
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function Reportes() {
    const { user } = useAuth()
    const [reportes, setReportes] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [generando, setGenerando] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [fechas, setFechas] = useState({ inicio: '', fin: '' })

    useEffect(() => {
        loadReportes()
    }, [])

    const loadReportes = async () => {
        try {
            const response = await api.get('/reportes')
            setReportes(response.data.data)
        } catch (error) {
            toast.error('Error cargando reportes')
        } finally {
            setIsLoading(false)
        }
    }

    const handleGenerarReportes = async () => {
        setGenerando(true)
        try {
            const data = {}
            if (fechas.inicio) data.semanaInicio = fechas.inicio
            if (fechas.fin) data.semanaFin = fechas.fin

            const response = await api.post('/reportes/generar', data)
            toast.success(response.data.message)
            setShowModal(false)
            setFechas({ inicio: '', fin: '' })
            loadReportes()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error generando reportes')
        } finally {
            setGenerando(false)
        }

        const handleEliminarReporte = async (id) => {
            if (!window.confirm('¿Estás seguro de eliminar este reporte de forma permanente?')) return

            try {
                await api.delete(`/reportes/${id}`)
                toast.success('Reporte eliminado correctamente')
                loadReportes()
            } catch (error) {
                toast.error('Error eliminando reporte')
            }
        }
    }

    const getWeekRange = () => {
        const now = new Date()
        const day = now.getDay()
        const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1)
        const monday = new Date(now.setDate(diffToMonday))
        const sunday = new Date(monday)
        sunday.setDate(monday.getDate() + 6)
        return {
            inicio: format(monday, 'yyyy-MM-dd'),
            fin: format(sunday, 'yyyy-MM-dd')
        }
    }

    const handleSetCurrentWeek = () => {
        const range = getWeekRange()
        setFechas(range)
    }

    return (
        <div>
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 className="dashboard-title">Reportes PDF</h1>
                    <p className="dashboard-subtitle">
                        {user?.rol === 'ADMIN'
                            ? 'Genera y descarga reportes semanales de mantenimiento'
                            : 'Descarga los reportes de mantenimiento de tu departamento'}
                    </p>
                </div>
                {user?.rol === 'ADMIN' && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={20} />
                        Generar Reportes
                    </button>
                )}
            </div>

            {/* Lista de reportes */}
            {isLoading ? (
                <div className="loading-page" style={{ minHeight: 300 }}>
                    <div className="spinner"></div>
                </div>
            ) : reportes.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <FileText size={48} className="empty-state-icon" />
                        <p className="empty-state-title">No hay reportes</p>
                        <p>
                            {user?.rol === 'ADMIN'
                                ? 'Genera el primer reporte semanal para comenzar.'
                                : 'Los reportes de tu departamento aparecerán aquí.'}
                        </p>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--spacing-4)' }}>
                    {reportes.map(reporte => (
                        <div key={reporte.id} className="card">
                            <div className="card-body">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 'var(--radius-lg)',
                                            background: reporte.tipo === 'GENERAL'
                                                ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))'
                                                : 'var(--color-gray-100)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {reporte.tipo === 'GENERAL' ? (
                                                <Building2 size={24} color="white" />
                                            ) : (
                                                <FileText size={24} style={{ color: 'var(--color-primary)' }} />
                                            )}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 600 }}>
                                                {reporte.tipo === 'GENERAL'
                                                    ? 'Reporte General'
                                                    : `Departamento ${reporte.departamento?.numero || ''}`}
                                            </p>
                                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>
                                                {reporte.departamento?.torre && `Torre ${reporte.departamento.torre}`}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`badge ${reporte.tipo === 'GENERAL' ? 'badge-info' : 'badge-success'}`}>
                                        {reporte.tipo === 'GENERAL' ? 'Áreas Comunes' : 'Departamento'}
                                    </span>
                                </div>

                                <div style={{
                                    marginTop: 16,
                                    padding: 'var(--spacing-3)',
                                    background: 'var(--color-gray-50)',
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    fontSize: 'var(--font-size-sm)',
                                    color: 'var(--color-gray-600)'
                                }}>
                                    <Calendar size={16} />
                                    Semana del {format(new Date(reporte.semanaInicio), 'dd/MM/yyyy')} al {format(new Date(reporte.semanaFin), 'dd/MM/yyyy')}
                                </div>

                                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>
                                        Generado: {format(new Date(reporte.createdAt), 'dd MMM yyyy, HH:mm', { locale: es })}
                                    </span>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {user?.rol === 'ADMIN' && (
                                            <button
                                                onClick={() => handleEliminarReporte(reporte.id)}
                                                className="btn btn-danger btn-sm"
                                                title="Eliminar reporte"
                                                style={{ background: '#ef4444', color: 'white', border: 'none' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                        <a
                                            href={reporte.urlPdf}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-primary btn-sm"
                                        >
                                            <Download size={16} />
                                            Descargar
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal para generar reportes */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Generar Reportes Semanales</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ marginBottom: 16, color: 'var(--color-gray-600)' }}>
                                Selecciona el rango de fechas para generar los reportes. Se generará un PDF para áreas comunes y uno por cada departamento con actividad.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group">
                                    <label className="form-label">Fecha inicio</label>
                                    <input
                                        type="date"
                                        value={fechas.inicio}
                                        onChange={(e) => setFechas(p => ({ ...p, inicio: e.target.value }))}
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Fecha fin</label>
                                    <input
                                        type="date"
                                        value={fechas.fin}
                                        onChange={(e) => setFechas(p => ({ ...p, fin: e.target.value }))}
                                        className="form-input"
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleSetCurrentWeek}
                                className="btn btn-secondary btn-sm"
                                style={{ marginTop: 8 }}
                            >
                                <RefreshCw size={14} />
                                Usar semana actual
                            </button>

                            <div style={{
                                marginTop: 20,
                                padding: 'var(--spacing-4)',
                                background: 'var(--color-gray-50)',
                                borderRadius: 'var(--radius-lg)',
                                fontSize: 'var(--font-size-sm)'
                            }}>
                                <strong>📋 El sistema generará:</strong>
                                <ul style={{ marginTop: 8, paddingLeft: 20, color: 'var(--color-gray-600)' }}>
                                    <li>1 PDF general con mantenimientos de áreas comunes</li>
                                    <li>1 PDF por cada departamento con actividad</li>
                                    <li>Envío automático por email a propietarios</li>
                                </ul>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowModal(false)}
                                disabled={generando}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleGenerarReportes}
                                disabled={generando}
                            >
                                {generando ? (
                                    <>
                                        <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                                        Generando...
                                    </>
                                ) : (
                                    <>
                                        <FileText size={18} />
                                        Generar Reportes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
