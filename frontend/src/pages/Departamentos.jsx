import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import {
    Plus,
    Search,
    Building2,
    User,
    Mail,
    Phone,
    MoreVertical,
    UserPlus,
    Edit,
    Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function Departamentos() {
    const { user } = useAuth()
    const [departamentos, setDepartamentos] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingDepto, setEditingDepto] = useState(null)
    const [formData, setFormData] = useState({
        numero: '',
        torre: '',
        piso: '',
        propietarioNombre: '',
        propietarioEmail: '',
        propietarioTelefono: ''
    })

    useEffect(() => {
        loadDepartamentos()
    }, [])

    const loadDepartamentos = async () => {
        try {
            const response = await api.get('/departamentos')
            setDepartamentos(response.data.data)
        } catch (error) {
            toast.error('Error cargando departamentos')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingDepto) {
                await api.put(`/departamentos/${editingDepto.id}`, formData)
                toast.success('Departamento actualizado')
            } else {
                await api.post('/departamentos', formData)
                toast.success('Departamento creado')
            }
            setShowModal(false)
            setEditingDepto(null)
            resetForm()
            loadDepartamentos()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error guardando departamento')
        }
    }

    const handleEdit = (depto) => {
        setEditingDepto(depto)
        setFormData({
            numero: depto.numero,
            torre: depto.torre || '',
            piso: depto.piso || '',
            propietarioNombre: depto.propietarioNombre,
            propietarioEmail: depto.propietarioEmail || '',
            propietarioTelefono: depto.propietarioTelefono || ''
        })
        setShowModal(true)
    }

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar este departamento?')) return
        try {
            await api.delete(`/departamentos/${id}`)
            toast.success('Departamento eliminado')
            loadDepartamentos()
        } catch (error) {
            toast.error('Error eliminando departamento')
        }
    }

    const handleCreateUser = async (id) => {
        try {
            await api.post(`/departamentos/${id}/crear-usuario`)
            toast.success('Usuario creado y email enviado')
            loadDepartamentos()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error creando usuario')
        }
    }

    const resetForm = () => {
        setFormData({
            numero: '',
            torre: '',
            piso: '',
            propietarioNombre: '',
            propietarioEmail: '',
            propietarioTelefono: ''
        })
    }

    const filteredDepartamentos = departamentos.filter(d =>
        d.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.propietarioNombre.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div>
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 className="dashboard-title">Departamentos</h1>
                    <p className="dashboard-subtitle">Gestiona los departamentos del condominio</p>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setEditingDepto(null); setShowModal(true); }}>
                    <Plus size={20} />
                    Nuevo Departamento
                </button>
            </div>

            {/* Buscador */}
            <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="card-body">
                    <div style={{ position: 'relative', maxWidth: 400 }}>
                        <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }} />
                        <input
                            type="text"
                            placeholder="Buscar por número o propietario..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-input"
                            style={{ paddingLeft: 40 }}
                        />
                    </div>
                </div>
            </div>

            {/* Grid de departamentos */}
            {isLoading ? (
                <div className="loading-page" style={{ minHeight: 300 }}>
                    <div className="spinner"></div>
                </div>
            ) : filteredDepartamentos.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <Building2 size={48} className="empty-state-icon" />
                        <p className="empty-state-title">No hay departamentos</p>
                        <p>Crea el primer departamento para comenzar.</p>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-4)' }}>
                    {filteredDepartamentos.map(depto => (
                        <div key={depto.id} className="card">
                            <div className="card-body">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 'var(--radius-lg)',
                                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontWeight: 700
                                        }}>
                                            {depto.numero}
                                        </div>
                                        <div>
                                            <h3 style={{ fontWeight: 600 }}>Departamento {depto.numero}</h3>
                                            {depto.torre && (
                                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>
                                                    Torre {depto.torre} {depto.piso && `- Piso ${depto.piso}`}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button onClick={() => handleEdit(depto)} className="btn btn-secondary btn-sm" style={{ padding: 6 }}>
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(depto.id)} className="btn btn-danger btn-sm" style={{ padding: 6 }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div style={{ marginTop: 'var(--spacing-4)', paddingTop: 'var(--spacing-4)', borderTop: '1px solid var(--color-gray-100)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <User size={16} style={{ color: 'var(--color-gray-400)' }} />
                                        <span style={{ fontSize: 'var(--font-size-sm)' }}>{depto.propietarioNombre}</span>
                                    </div>
                                    {depto.propietarioEmail && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                            <Mail size={16} style={{ color: 'var(--color-gray-400)' }} />
                                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>{depto.propietarioEmail}</span>
                                        </div>
                                    )}
                                    {depto.propietarioTelefono && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Phone size={16} style={{ color: 'var(--color-gray-400)' }} />
                                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>{depto.propietarioTelefono}</span>
                                        </div>
                                    )}
                                </div>

                                <div style={{ marginTop: 'var(--spacing-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>
                                        {depto._count?.mantenimientos || 0} mantenimientos
                                    </span>
                                    {depto.propietarioEmail && !depto.usuarios?.length && (
                                        <button
                                            onClick={() => handleCreateUser(depto.id)}
                                            className="btn btn-secondary btn-sm"
                                        >
                                            <UserPlus size={14} />
                                            Crear Usuario
                                        </button>
                                    )}
                                    {depto.usuarios?.length > 0 && (
                                        <span className="badge badge-success">Usuario creado</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingDepto ? 'Editar Departamento' : 'Nuevo Departamento'}
                            </h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Número *</label>
                                        <input
                                            type="text"
                                            value={formData.numero}
                                            onChange={(e) => setFormData(p => ({ ...p, numero: e.target.value }))}
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Torre</label>
                                        <input
                                            type="text"
                                            value={formData.torre}
                                            onChange={(e) => setFormData(p => ({ ...p, torre: e.target.value }))}
                                            className="form-input"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Piso</label>
                                    <input
                                        type="text"
                                        value={formData.piso}
                                        onChange={(e) => setFormData(p => ({ ...p, piso: e.target.value }))}
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Nombre del Propietario *</label>
                                    <input
                                        type="text"
                                        value={formData.propietarioNombre}
                                        onChange={(e) => setFormData(p => ({ ...p, propietarioNombre: e.target.value }))}
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email del Propietario</label>
                                    <input
                                        type="email"
                                        value={formData.propietarioEmail}
                                        onChange={(e) => setFormData(p => ({ ...p, propietarioEmail: e.target.value }))}
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Teléfono</label>
                                    <input
                                        type="tel"
                                        value={formData.propietarioTelefono}
                                        onChange={(e) => setFormData(p => ({ ...p, propietarioTelefono: e.target.value }))}
                                        className="form-input"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingDepto ? 'Guardar Cambios' : 'Crear Departamento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
