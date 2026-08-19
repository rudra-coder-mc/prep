'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { buttonClass } from '@/components/ui/button'
import { signOut } from '@/lib/auth-client'

export function SignOutButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true)
        await signOut()
        router.push('/login')
        router.refresh()
      }}
      className={buttonClass({ variant: 'ghost', size: 'sm' })}
    >
      Sign out
    </button>
  )
}
