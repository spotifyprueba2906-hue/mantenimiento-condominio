import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import {
    ArrowLeft,
    Calendar,
    Building2,
    User,
    Clock,
    CheckCircle,
    AlertTriangle,
    Upload,
    Trash2,
    Edit,
    X
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function MantenimientoDetalle() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [mantenimiento, setMantenimiento] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [selectedImage, setSelectedImage] = useState(null)

    useEffect(() => {
        loadMantenimiento()
    }, [id])

    const loadMantenimiento = async () => {
        try {
            const response = await api.get(`/mantenimientos/${id}`)
            setMantenimiento(response.data.data)
        } catch (error) {
            toast.error('Error cargando mantenimiento')
            navigate('/mantenimientos')
        } finally {
            setIsLoading(false)
        }
    }

    const handleUploadImages = async (e) => {
        const files = e.target.files
        if (!files.length) return

        setUploading(true)
        const formData = new FormData()
        Array.from(files).forEach(file => formData.append('imagenes', file))

        try {
            await api.post(`/imagenes/mantenimiento/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            toast.success('Imágenes subidas correctamente')
            loadMantenimiento()
        } catch (error) {
            toast.error('Error subiendo imágenes')
        } finally {
            setUploading(false)
        }
    }

    const handleDeleteImage = async (imageId) => {
        if (!confirm('¿Eliminar esta imagen?')) return

        try {
            await api.delete(`/imagenes/${imageId}`)
            toast.success('Imagen eliminada')
            loadMantenimiento()
        } catch (error) {
            toast.error('Error eliminando imagen')
        }
    }

    const handleChangeStatus = async (nuevoEstado) => {
        try {
            await api.patch(`/mantenimientos/${id}/estado`, { estado: nuevoEstado })
            toast.success('Estado actualizado')
            loadMantenimiento()
        } catch (error) {
            toast.error('Error actualizando estado')
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
            <span className={`badge ${cls}`} style={{ fontSize: 'var(--font-size-sm)', padding: '6px 12px' }}>
                <Icon size={14} style={{ marginRight: 6 }} />
                {label}
            </span>
        )
    }

    if (isLoading) {
        return (
            <div className="loading-page" style={{ minHeight: 400 }}>
                <div className="spinner"></div>
            </div>
        )
    }

    if (!mantenimiento) return null

    return (
        <div>
            <button
                onClick={() => navigate('/mantenimientos')}
                className="btn btn-secondary btn-sm"
                style={{ marginBottom: 'var(--spacing-6)' }}
            >
                <ArrowLeft size={18} />
                Volver
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--spacing-6)' }}>
                {/* Contenido principal */}
                <div>
                    <div className="card">
                        <div className="card-body">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-4)' }}>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <span className="badge badge-info">{mantenimiento.tipo}</span>
                                    {getStatusBadge(mantenimiento.estado)}
                                </div>
                                {user?.rol === 'ADMIN' && (
                                    <select
                                        value={mantenimiento.estado}
                                        onChange={(e) => handleChangeStatus(e.target.value)}
                                        className="form-input"
                                        style={{ width: 'auto', padding: '6px 12px', fontSize: 'var(--font-size-sm)' }}
                                    >
                                        <option value="PENDIENTE">Pendiente</option>
                                        <option value="EN_PROGRESO">En Progreso</option>
                                        <option value="COMPLETADO">Completado</option>
                                        <option value="CANCELADO">Cancelado</option>
                                    </select>
                                )}
                            </div>

                            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: 'var(--spacing-4)' }}>
                                {mantenimiento.titulo}
                            </h1>

                            <p style={{ color: 'var(--color-gray-600)', lineHeight: 1.8, marginBottom: 'var(--spacing-6)' }}>
                                {mantenimiento.descripcion}
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-4)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'var(--color-gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Calendar size={18} style={{ color: 'var(--color-gray-500)' }} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>Fecha Inicio</p>
                                        <p style={{ fontWeight: 500 }}>{format(new Date(mantenimiento.fechaInicio), 'dd MMMM yyyy', { locale: es })}</p>
                                    </div>
                                </div>

                                {mantenimiento.fechaFin && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'var(--color-gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>Fecha Fin</p>
                                            <p style={{ fontWeight: 500 }}>{format(new Date(mantenimiento.fechaFin), 'dd MMMM yyyy', { locale: es })}</p>
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'var(--color-gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Building2 size={18} style={{ color: 'var(--color-gray-500)' }} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>Área</p>
                                        <p style={{ fontWeight: 500 }}>
                                            {mantenimiento.area === 'COMUN' ? 'Área Común' : `Departamento ${mantenimiento.departamento?.numero}`}
                                        </p>
                                    </div>
                                </div>

                                {mantenimiento.responsable && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'var(--color-gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <User size={18} style={{ color: 'var(--color-gray-500)' }} />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>Responsable</p>
                                            <p style={{ fontWeight: 500 }}>{mantenimiento.responsable}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {mantenimiento.notas && (
                                <div style={{ marginTop: 'var(--spacing-6)', padding: 'var(--spacing-4)', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-lg)' }}>
                                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: 8 }}>Notas adicionales:</p>
                                    <p style={{ color: 'var(--color-gray-600)', fontSize: 'var(--font-size-sm)' }}>{mantenimiento.notas}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Galería de imágenes */}
                    <div className="card" style={{ marginTop: 'var(--spacing-6)' }}>
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Galería de Imágenes</h2>
                            {user?.rol === 'ADMIN' && (
                                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                                    <Upload size={16} />
                                    {uploading ? 'Subiendo...' : 'Subir Imágenes'}
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleUploadImages}
                                        style={{ display: 'none' }}
                                        disabled={uploading}
                                    />
                                </label>
                            )}
                        </div>
                        <div className="card-body">
                            {mantenimiento.imagenes?.length === 0 ? (
                                <div className="empty-state" style={{ padding: 'var(--spacing-8)' }}>
                                    <p>No hay imágenes registradas</p>
                                </div>
                            ) : (
                                <div className="image-grid">
                                    {mantenimiento.imagenes?.map(img => (
                                        <div key={img.id} className="image-card">
                                            <img
                                                src={img.urlCloudinary}
                                                alt={img.descripcion || 'Imagen de mantenimiento'}
                                                onClick={() => setSelectedImage(img)}
                                            />
                                            {user?.rol === 'ADMIN' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.id); }}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 8,
                                                        right: 8,
                                                        background: 'var(--color-error)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: 'var(--radius-full)',
                                                        width: 28,
                                                        height: 28,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                            <div className="image-overlay">
                                                {img.descripcion || 'Ver imagen'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div>
                    {mantenimiento.costo && (
                        <div className="card" style={{ marginBottom: 'var(--spacing-4)' }}>
                            <div className="card-body" style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>Costo</p>
                                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-primary)' }}>
                                    ${parseFloat(mantenimiento.costo).toLocaleString('es-MX')}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="card">
                        <div className="card-body">
                            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, marginBottom: 'var(--spacing-4)' }}>
                                Información
                            </h3>
                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
                                <p style={{ marginBottom: 8 }}>
                                    <strong>Tipo:</strong> {mantenimiento.tipo}
                                </p>
                                <p style={{ marginBottom: 8 }}>
                                    <strong>Área:</strong> {mantenimiento.area === 'COMUN' ? 'Común' : 'Departamento'}
                                </p>
                                <p style={{ marginBottom: 8 }}>
                                    <strong>Imágenes:</strong> {mantenimiento.imagenes?.length || 0}
                                </p>
                                <p>
                                    <strong>Creado:</strong> {format(new Date(mantenimiento.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de imagen */}
            {selectedImage && (
                <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
                    <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
                        <button
                            onClick={() => setSelectedImage(null)}
                            style={{
                                position: 'absolute',
                                top: -40,
                                right: 0,
                                background: 'white',
                                border: 'none',
                                borderRadius: 'var(--radius-full)',
                                width: 32,
                                height: 32,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={20} />
                        </button>
                        <img
                            src={selectedImage.urlCloudinary}
                            alt={selectedImage.descripcion}
                            style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 'var(--radius-lg)' }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
