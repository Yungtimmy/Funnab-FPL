'use client'
import { supabase } from '@/lib/supabase'
import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    async function test() {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.log('Connection failed:', error)
      } else {
        console.log('Supabase connected!')
      }
    }
    test()
  }, [])

  return <h1>FFL Test</h1>
}