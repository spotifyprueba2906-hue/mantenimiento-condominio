import { useState, useEffect } from 'react'
import api from '../services/api'
import {
    MessageSquare,
    Building2,
    Calendar,
    Trash2,
    Filter,
    Search
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function SugerenciasAdmin() {
    const [sugerencias, setSugerencias] = useState([])
    const [departamentos, setDepartamentos] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [filtroDepto, setFiltroDepto] = useState('')
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })

    useEffect(() => {
        loadDepartamentos()
    }, [])

    useEffect(() => {
        loadSugerencias()
    }, [filtroDepto, pagination.page])

    const loadDepartamentos = async () => {
        try {
            const response = await api.get('/departamentos')
            setDepartamentos(response.data.data)
        } catch (error) {
            console.error('Error cargando departamentos:', error)
        }
    }

    const loadSugerencias = async () => {
        try {
            const params = {
                page: pagination.page,
                limit: 20,
                ...(filtroDepto && { departamentoId: filtroDepto })
            }
            const response = await api.get('/sugerencias', { params })
            setSugerencias(response.data.data)
            setPagination(prev => ({
                ...prev,
                totalPages: response.data.pagination.totalPages,
                total: response.data.pagination.total
            }))
        } catch (error) {
            toast.error('Error cargando sugerencias')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar esta sugerencia?')) return
        try {
            await api.delete(`/sugerencias/${id}`)
            toast.success('Sugerencia eliminada')
            loadSugerencias()
        } catch (error) {
            toast.error('Error eliminando sugerencia')
        }
    }

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">Buzón de Sugerencias</h1>
                <p className="dashboard-subtitle">
                    {pagination.total} sugerencias recibidas
                </p>
            </div>

            {/* Filtros */}
            <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <Filter size={20} style={{ color: 'var(--color-gray-400)' }} />
                    <select
                        value={filtroDepto}
                        onChange={(e) => {
                            setFiltroDepto(e.target.value)
                            setPagination(p => ({ ...p, page: 1 }))
                        }}
                        className="form-input"
                        style={{ width: 'auto' }}
                    >
                        <option value="">Todos los departamentos</option>
                        {departamentos.map(d => (
                            <option key={d.id} value={d.id}>
                                Depto {d.numero} {d.torre ? `- Torre ${d.torre}` : ''}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Lista de sugerencias */}
            {isLoading ? (
                <div className="loading-page" style={{ minHeight: 300 }}>
                    <div className="spinner"></div>
                </div>
            ) : sugerencias.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <MessageSquare size={48} className="empty-state-icon" />
                        <p className="empty-state-title">No hay sugerencias</p>
                        <p>Las sugerencias de los propietarios aparecerán aquí.</p>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                    {sugerencias.map(sug => (
                        <div key={sug.id} className="card">
                            <div className="card-body">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                        <div style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 'var(--radius-lg)',
                                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontWeight: 700,
                                            fontSize: 'var(--font-size-sm)'
                                        }}>
                                            {sug.departamento?.numero || '?'}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 600 }}>
                                                Departamento {sug.departamento?.numero}
                                                {sug.departamento?.torre && ` - Torre ${sug.departamento.torre}`}
                                            </p>
                                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>
                                                {sug.departamento?.propietarioNombre}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <span style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            fontSize: 'var(--font-size-sm)',
                                            color: 'var(--color-gray-400)'
                                        }}>
                                            <Calendar size={14} />
                                            {format(new Date(sug.createdAt), 'dd MMM yyyy, HH:mm', { locale: es })}
                                        </span>
                                        <button
                                            onClick={() => handleDelete(sug.id)}
                                            className="btn btn-danger btn-sm"
                                            style={{ padding: 6 }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div style={{
                                    padding: 'var(--spacing-4)',
                                    background: 'var(--color-gray-50)',
                                    borderRadius: 'var(--radius-lg)',
                                    lineHeight: 1.6
                                }}>
                                    {sug.mensaje}
                                </div>
                            </div>
                        </div>
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
