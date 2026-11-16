
import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { isStaffRole } from '../lib/staff'

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    let active = true

    async function checkAdmin() {
      const { data: { user }, error } =
        await supabase.auth.getUser()

      if (error || !user) {
        if (active) setStatus('denied')
        return
      }

      const { data: profile, error: profileError } =
        await supabase
          .from('admin_profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle()

      if (!active) return

      if (profileError || !profile || !isStaffRole(profile.role)) {
        await supabase.auth.signOut()
        setStatus('denied')
        return
      }

      setStatus('allowed')
    }

    checkAdmin()

    return () => {
      active = false
    }
  }, [])

  if (status === 'checking') {
    return <p>Checking administrator access...</p>
  }

  if (status === 'denied') {
    return <Navigate to="/admin/login" replace />
  }

  return children
}
