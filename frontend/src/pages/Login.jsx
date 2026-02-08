import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [formData, setFormData] = useState({ email: '', password: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState({})

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        setErrors(prev => ({ ...prev, [name]: '' }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setErrors({})

        try {
            const usuario = await login(formData.email, formData.password)
            toast.success(`¡Bienvenido, ${usuario.nombre}!`)

            // Redirigir según el estado del usuario
            if (usuario.rol === 'PROPIETARIO' && !usuario.passwordCambiada) {
                navigate('/cambiar-password')
            } else {
                navigate('/dashboard')
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Error al iniciar sesión'
            toast.error(message)
            setErrors({ general: message })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <svg viewBox="0 0 100 100" style={{ width: 80, height: 80, margin: '0 auto 16px' }}>
                        <defs>
                            <linearGradient id="loginGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{ stopColor: '#00B67A' }} />
                                <stop offset="100%" style={{ stopColor: '#0EA5E9' }} />
                            </linearGradient>
                        </defs>
                        <circle cx="50" cy="50" r="45" fill="url(#loginGrad)" />
                        <text x="50" y="62" fontFamily="Inter, sans-serif" fontSize="32" fontWeight="bold" fill="white" textAnchor="middle">G</text>
                    </svg>
                    <h1 className="login-title">Sistema de Mantenimiento</h1>
                    <p className="login-subtitle">Ingresa tus credenciales para continuar</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">Correo electrónico</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`form-input ${errors.email ? 'error' : ''}`}
                            placeholder="correo@ejemplo.com"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">Contraseña</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`form-input ${errors.password ? 'error' : ''}`}
                                placeholder="••••••••"
                                required
                                disabled={isLoading}
                                style={{ paddingRight: 44 }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
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
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
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
                            <>
                                <LogIn size={20} />
                                Iniciar Sesión
                            </>
                        )}
                    </button>
                </form>

                <div style={{
                    marginTop: 'var(--spacing-6)',
                    textAlign: 'center',
                    paddingTop: 'var(--spacing-6)',
                    borderTop: '1px solid var(--color-gray-100)'
                }}>
                    <a
                        href="/areas-comunes"
                        style={{
                            color: 'var(--color-gray-500)',
                            fontSize: 'var(--font-size-sm)'
                        }}
                    >
                        Ver mantenimiento de áreas comunes →
                    </a>
                </div>
            </div>
        </div>
    )
}
