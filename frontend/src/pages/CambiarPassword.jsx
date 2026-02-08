import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Lock, Eye, EyeOff, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CambiarPassword() {
    const navigate = useNavigate()
    const { cambiarPassword, user } = useAuth()
    const [formData, setFormData] = useState({
        passwordActual: '',
        passwordNueva: '',
        confirmarPassword: ''
    })
    const [showPasswords, setShowPasswords] = useState({
        actual: false,
        nueva: false,
        confirmar: false
    })
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState({})

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        setErrors(prev => ({ ...prev, [name]: '' }))
    }

    const validatePassword = (password) => {
        const hasMinLength = password.length >= 8
        const hasUppercase = /[A-Z]/.test(password)
        const hasLowercase = /[a-z]/.test(password)
        const hasNumber = /\d/.test(password)
        return { hasMinLength, hasUppercase, hasLowercase, hasNumber }
    }

    const validation = validatePassword(formData.passwordNueva)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrors({})

        // Validaciones
        if (formData.passwordNueva !== formData.confirmarPassword) {
            setErrors({ confirmarPassword: 'Las contraseñas no coinciden' })
            return
        }

        const isValidPassword = Object.values(validation).every(Boolean)
        if (!isValidPassword) {
            setErrors({ passwordNueva: 'La contraseña no cumple los requisitos' })
            return
        }

        setIsLoading(true)

        try {
            await cambiarPassword(formData.passwordActual, formData.passwordNueva)
            toast.success('Contraseña actualizada correctamente')
            navigate('/dashboard')
        } catch (error) {
            const message = error.response?.data?.message || 'Error al cambiar contraseña'
            toast.error(message)
            setErrors({ general: message })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-card" style={{ maxWidth: 480 }}>
                <div className="login-logo">
                    <div style={{
                        width: 80,
                        height: 80,
                        margin: '0 auto 16px',
                        borderRadius: 'var(--radius-full)',
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Lock size={36} color="white" />
                    </div>
                    <h1 className="login-title">Cambiar Contraseña</h1>
                    <p className="login-subtitle">
                        Hola {user?.nombre}, por seguridad debes cambiar tu contraseña temporal
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="passwordActual" className="form-label">Contraseña actual</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPasswords.actual ? 'text' : 'password'}
                                id="passwordActual"
                                name="passwordActual"
                                value={formData.passwordActual}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="Contraseña temporal"
                                required
                                disabled={isLoading}
                                style={{ paddingRight: 44 }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords(p => ({ ...p, actual: !p.actual }))}
                                style={{
                                    position: 'absolute',
                                    right: 12,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-gray-400)',
                                    padding: 4
                                }}
                            >
                                {showPasswords.actual ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="passwordNueva" className="form-label">Nueva contraseña</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPasswords.nueva ? 'text' : 'password'}
                                id="passwordNueva"
                                name="passwordNueva"
                                value={formData.passwordNueva}
                                onChange={handleChange}
                                className={`form-input ${errors.passwordNueva ? 'error' : ''}`}
                                placeholder="Mínimo 8 caracteres"
                                required
                                disabled={isLoading}
                                style={{ paddingRight: 44 }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords(p => ({ ...p, nueva: !p.nueva }))}
                                style={{
                                    position: 'absolute',
                                    right: 12,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-gray-400)',
                                    padding: 4
                                }}
                            >
                                {showPasswords.nueva ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        {/* Requisitos de contraseña */}
                        <div style={{ marginTop: 'var(--spacing-3)' }}>
                            {[
                                { key: 'hasMinLength', label: 'Mínimo 8 caracteres' },
                                { key: 'hasUppercase', label: 'Una letra mayúscula' },
                                { key: 'hasLowercase', label: 'Una letra minúscula' },
                                { key: 'hasNumber', label: 'Un número' }
                            ].map(req => (
                                <div
                                    key={req.key}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        fontSize: 'var(--font-size-sm)',
                                        color: validation[req.key] ? 'var(--color-success)' : 'var(--color-gray-400)',
                                        marginBottom: 4
                                    }}
                                >
                                    <Check size={14} />
                                    <span>{req.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmarPassword" className="form-label">Confirmar contraseña</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPasswords.confirmar ? 'text' : 'password'}
                                id="confirmarPassword"
                                name="confirmarPassword"
                                value={formData.confirmarPassword}
                                onChange={handleChange}
                                className={`form-input ${errors.confirmarPassword ? 'error' : ''}`}
                                placeholder="Repite la nueva contraseña"
                                required
                                disabled={isLoading}
                                style={{ paddingRight: 44 }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords(p => ({ ...p, confirmar: !p.confirmar }))}
                                style={{
                                    position: 'absolute',
                                    right: 12,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-gray-400)',
                                    padding: 4
                                }}
                            >
                                {showPasswords.confirmar ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {errors.confirmarPassword && (
                            <p className="form-error">{errors.confirmarPassword}</p>
                        )}
                    </div>

                    {errors.general && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: 'var(--color-error)',
                            padding: 'var(--spacing-3) var(--spacing-4)',
                            borderRadius: 'var(--radius-lg)',
                            marginBottom: 'var(--spacing-4)',
                            fontSize: 'var(--font-size-sm)'
                        }}>
                            {errors.general}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%' }}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                        ) : (
                            'Cambiar Contraseña'
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
