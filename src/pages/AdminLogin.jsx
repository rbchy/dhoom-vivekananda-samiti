import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { isStaffRole } from '../lib/staff'
import { useNavigate } from 'react-router-dom'
import { checkEmail, cleanErrors } from '../lib/validation'
import { BackToMainButton, FieldError, invalidProps } from '../components/FormHelpers'

export default function AdminLogin() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function validate() {
    const found = cleanErrors({
      email: checkEmail(email),
      password: !password
        ? 'Password is required.'
        : password.length < 6
          ? 'Password must be at least 6 characters.'
          : ''
    })
    setErrors(found)
    return Object.keys(found).length === 0
  }

  async function handleLogin(event) {
    event.preventDefault()
    setError('')
    if (!validate()) return
    setLoading(true)

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        })

      if (loginError) throw loginError

      const { data: profile, error: profileError } =
        await supabase
          .from('admin_profiles')
          .select('role')
          .eq('user_id', data.user.id)
          .maybeSingle()

      if (profileError) throw profileError

      if (!profile || !isStaffRole(profile.role)) {
        await supabase.auth.signOut()
        throw new Error('You are not authorized to use the admin panel.')
      }

      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Email or password is incorrect.'
        : err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-page">
      <form className="admin-login-card" onSubmit={handleLogin} noValidate>
        <img className="admin-login-emblem" src={`${import.meta.env.BASE_URL}emblem.svg`} alt="Dhoom Vivekananda Samiti" />
        <h1>Admin Login</h1>
        <p>Dhoom Vivekananda Samiti</p>

        <label htmlFor="admin-email">Email Address</label>
        <input
          id="admin-email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }}
          placeholder="Enter admin email"
          autoComplete="username"
          maxLength={254}
          required
          {...invalidProps(errors, 'email', 'login')}
        />
        <FieldError id="login-email-error" message={errors.email} />

        <label htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })) }}
          placeholder="Enter password"
          autoComplete="current-password"
          maxLength={128}
          required
          {...invalidProps(errors, 'password', 'login')}
        />
        <FieldError id="login-password-error" message={errors.password} />

        {error && <p className="admin-error" role="alert">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <BackToMainButton className="admin-back-btn" label="Back to Main Site" />
      </form>
    </div>
  )
}
