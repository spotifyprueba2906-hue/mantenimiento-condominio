import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

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
                setUser(response.data.data)
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
        }
    }

    const cambiarPassword = async (passwordActual, passwordNueva) => {
        await api.post('/auth/cambiar-password', { passwordActual, passwordNueva })
        // Después de cambiar la contraseña, actualizar el usuario
        setUser(prev => ({ ...prev, passwordCambiada: true }))
    }

    const updateUser = (userData) => {
        setUser(prev => ({ ...prev, ...userData }))
    }

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            login,
            logout,
            cambiarPassword,
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
