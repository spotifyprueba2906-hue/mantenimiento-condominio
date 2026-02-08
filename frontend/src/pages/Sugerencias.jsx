import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { MessageSquare, Send, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Sugerencias() {
    const { user } = useAuth()
    const [mensaje, setMensaje] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [enviada, setEnviada] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (mensaje.trim().length < 10) {
            toast.error('El mensaje debe tener al menos 10 caracteres')
            return
        }

        setIsLoading(true)
        try {
            await api.post('/sugerencias', { mensaje })
            setEnviada(true)
            setMensaje('')
            toast.success('Sugerencia enviada correctamente')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al enviar sugerencia')
        } finally {
            setIsLoading(false)
        }
    }

    if (enviada) {
        return (
            <div>
                <div className="dashboard-header">
                    <h1 className="dashboard-title">Buzón de Sugerencias</h1>
                </div>

                <div className="card" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
                    <div className="card-body" style={{ padding: 'var(--spacing-8)' }}>
                        <div style={{
                            width: 80,
                            height: 80,
                            margin: '0 auto 24px',
                            borderRadius: 'var(--radius-full)',
                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <CheckCircle size={40} color="white" />
                        </div>
                        <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 16 }}>
                            ¡Gracias por tu sugerencia!
                        </h2>
                        <p style={{ color: 'var(--color-gray-600)', marginBottom: 24 }}>
                            Tu mensaje ha sido enviado correctamente. La administración revisará tu sugerencia.
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={() => setEnviada(false)}
                        >
                            Enviar otra sugerencia
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">Buzón de Sugerencias</h1>
                <p className="dashboard-subtitle">
                    Comparte tus sugerencias o comentarios sobre el mantenimiento del condominio
                </p>
            </div>

            <div className="card" style={{ maxWidth: 700, margin: '0 auto' }}>
                <div className="card-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: 'var(--radius-lg)',
                            background: 'var(--color-gray-100)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <MessageSquare size={24} style={{ color: 'var(--color-primary)' }} />
                        </div>
                        <div>
                            <h3 style={{ fontWeight: 600 }}>Nueva Sugerencia</h3>
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>
                                Departamento {user?.departamento?.numero || user?.departamentoId}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Tu mensaje</label>
                            <textarea
                                value={mensaje}
                                onChange={(e) => setMensaje(e.target.value)}
                                className="form-input"
                                placeholder="Escribe tu sugerencia, comentario o queja aquí..."
                                rows={6}
                                maxLength={1000}
                                required
                                disabled={isLoading}
                            />
                            <p style={{
                                fontSize: 'var(--font-size-xs)',
                                color: 'var(--color-gray-400)',
                                marginTop: 8,
                                textAlign: 'right'
                            }}>
                                {mensaje.length}/1000 caracteres
                            </p>
                        </div>

                        <div style={{
                            padding: 'var(--spacing-4)',
                            background: 'var(--color-gray-50)',
                            borderRadius: 'var(--radius-lg)',
                            marginBottom: 'var(--spacing-6)',
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--color-gray-600)'
                        }}>
                            <strong>💡 Nota:</strong> Tu sugerencia será revisada por la administración.
                            Este es un canal de comunicación unidireccional para mejorar el servicio.
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%' }}
                            disabled={isLoading || mensaje.trim().length < 10}
                        >
                            {isLoading ? (
                                <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                            ) : (
                                <>
                                    <Send size={20} />
                                    Enviar Sugerencia
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
