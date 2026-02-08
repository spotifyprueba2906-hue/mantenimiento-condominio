import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [departamentoActivo, setDepartamentoActivo] = useState(null)

    // Cargar usuario al inicio
    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('accessToken')

            if (!token) {
                setIsLoading(false)
                return
            }

            try {
                const response = await api.get('/auth/me')
                const userData = response.data.data
                setUser(userData)

                // Establecer departamento activo
                if (userData.departamentoActivo) {
                    setDepartamentoActivo(userData.departamentoActivo)
                } else if (userData.departamentos?.length > 0) {
                    setDepartamentoActivo(userData.departamentos[0])
                }
            } catch (error) {
                // Token inválido o expirado
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
            } finally {
                setIsLoading(false)
            }
        }

        loadUser()
    }, [])

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password })
        const { accessToken, refreshToken, usuario } = response.data.data

        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        setUser(usuario)

        // Establecer departamento activo
        if (usuario.departamentoActivo) {
            setDepartamentoActivo(usuario.departamentoActivo)
        } else if (usuario.departamentos?.length > 0) {
            setDepartamentoActivo(usuario.departamentos[0])
        }

        return usuario
    }

    const logout = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken')
            await api.post('/auth/logout', { refreshToken })
        } catch (error) {
            // Ignorar errores de logout
        } finally {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            setUser(null)
            setDepartamentoActivo(null)
        }
    }

    const cambiarPassword = async (passwordActual, passwordNueva) => {
        await api.post('/auth/cambiar-password', { passwordActual, passwordNueva })
        // Después de cambiar la contraseña, actualizar el usuario
        setUser(prev => ({ ...prev, passwordCambiada: true }))
    }

    const cambiarDepartamento = async (departamentoId) => {
        const response = await api.post('/auth/cambiar-departamento', { departamentoId })
        const { departamentoActivo: nuevoDepartamento } = response.data.data
        setDepartamentoActivo(nuevoDepartamento)

        // Actualizar en la lista de departamentos del usuario
        setUser(prev => ({
            ...prev,
            departamentos: prev.departamentos.map(d => ({
                ...d,
                esPrincipal: d.id === departamentoId
            })),
            departamentoActivo: nuevoDepartamento
        }))

        return nuevoDepartamento
    }

    const updateUser = (userData) => {
        setUser(prev => ({ ...prev, ...userData }))
    }

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            departamentoActivo,
            login,
            logout,
            cambiarPassword,
            cambiarDepartamento,
            updateUser
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider')
    }
    return context
}
