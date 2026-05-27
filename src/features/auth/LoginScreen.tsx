/**
 * LoginScreen
 *
 * Renders the authentication form with email and password fields and a
 * sign-in button. Consumes AuthContext internally for auth operations.
 * Validates input with loginFormSchema and displays inline errors.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 7.1, 7.2, 7.3, 7.4
 */

import { useState } from 'react'
import { Text, View } from 'react-native'

import { FormField } from '@/src/components/FormField'
import { SubmitButton } from '@/src/components/SubmitButton'

import { useAuth } from './AuthContext'
import { loginFormSchema } from './schemas'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IFieldErrors {
  email?: string
  password?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const LoginScreen = () => {
  const { signIn } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<IFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    // Clear previous errors
    setFieldErrors({})
    setFormError(null)

    // Validate with loginFormSchema
    const result = loginFormSchema.safeParse({ email, password })

    if (!result.success) {
      const errors: IFieldErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof IFieldErrors
        if (!errors[field]) {
          errors[field] = issue.message
        }
      }
      setFieldErrors(errors)
      return
    }

    // Valid — attempt sign-in
    setIsLoading(true)
    try {
      await signIn({ email: result.data.email, password: result.data.password })
    } catch {
      setFormError('Unable to sign in. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View className="flex-1 items-center justify-center px-4">
      <View className="w-full max-w-[480px]">
        <Text className="text-3xl font-[Manrope-Bold] text-center mb-8">
          Garden Tracker
        </Text>

        {formError ? (
          <Text className="text-sm text-red-500 text-center mb-4">
            {formError}
          </Text>
        ) : null}

        <FormField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={fieldErrors.email}
        />

        <FormField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          error={fieldErrors.password}
        />

        <SubmitButton
          label="Sign In"
          onPress={handleSubmit}
          isLoading={isLoading}
          className="mt-4"
        />
      </View>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { LoginScreen }
