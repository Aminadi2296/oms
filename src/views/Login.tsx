'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// NextAuth Imports
import Image from 'next/image'

import { signIn, useSession } from 'next-auth/react'

// MUI Imports
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { Mode } from '@core/types'

// Component Imports
import Link from '@components/Link'
import Logo from '@components/layout/shared/Logo'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'
import { LOGIN } from '@/constants/texts'
import { ROUTES } from '@/constants/routes'

const Login = ({}: { mode: Mode }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Hooks
  const router = useRouter()
  const { data: session, status } = useSession()
  const { settings } = useSettings()

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false
      })

      if (result?.error) {
        setError(LOGIN.invalidUsernameOrPassword)
        console.error('Login error:', result.error)
      }

      // No redirigir aquí, solo cuando status sea 'authenticated' en el useEffect
    } catch (error) {
      setError(LOGIN.anErrorOccurredDuringLogin)
      console.error('Login exception:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push(ROUTES.HOME)
    }
  }, [status, session, router])

  // Show loading while checking authentication status
  if (status === 'loading') {
    return (
      <div className='flex bs-full justify-center items-center'>
        <CircularProgress />
      </div>
    )
  }

  // Don't render login form if already authenticated
  if (status === 'authenticated' && session) {
    return null
  }

  return (
    <div className='flex bs-full justify-center'>
      <div
        className={classnames(
          'flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative p-6 max-md:hidden',
          {
            'border-ie': settings.skin === 'bordered'
          }
        )}
      >
        <div className='pli-6 max-lg:mbs-40 lg:mbe-24'>
          <Image
            src='/images/wm-people-trans.png'
            width={612}
            height={408}
            alt='character-illustration'
            className='max-bs-[673px] max-is-full bs-auto'
          />
        </div>
      </div>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <Link className='absolute block-start-5 sm:block-start-[38px] inline-start-6 sm:inline-start-[38px]'>
          <Logo />
        </Link>
        <div className='flex flex-col gap-5 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-11 sm:mbs-14 md:mbs-0'>
          <div>
            <Typography variant='h4'>{LOGIN.welcome}</Typography>
            <Typography className='mbs-1'>{LOGIN.pleaseSignIn}</Typography>
          </div>
          {error && (
            <Alert severity='error' onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          <form noValidate autoComplete='off' onSubmit={handleSubmit} className='flex flex-col gap-5'>
            <TextField
              autoFocus
              fullWidth
              name='username'
              label={LOGIN.username}
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={isLoading}
            />
            <TextField
              fullWidth
              name='password'
              label={LOGIN.password}
              type={isPasswordShown ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoading}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        size='small'
                        edge='end'
                        onClick={handleClickShowPassword}
                        onMouseDown={e => e.preventDefault()}
                        disabled={isLoading}
                      >
                        <i className={isPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />
            <div className='flex justify-between items-center flex-wrap gap-x-3 gap-y-1'>
              <FormControlLabel control={<Checkbox />} label={LOGIN.rememberMe} />
              <Typography className='text-end' color='primary.main' component={Link}>
                {LOGIN.forgotPassword}
              </Typography>
            </div>
            <Button
              fullWidth
              variant='contained'
              type='submit'
              disabled={isLoading || !username || !password}
              startIcon={isLoading ? <CircularProgress size={20} /> : null}
            >
              {isLoading ? LOGIN.loggingIn : LOGIN.logIn}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
