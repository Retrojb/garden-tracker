/**
 * Sign-in screen using Cognito authentication via aws-amplify.
 *
 * Renders email and password fields with inline validation errors.
 * On successful sign-in, the auth state change triggers navigation
 * to the main app via the (auth) layout redirect.
 *
 * If token refresh fails (Requirement 7.3), the user is redirected here
 * to re-authenticate.
 *
 * Requirements: 7.1, 7.3
 */

import { useState } from 'react'
import { Text, View } from 'react-native'

import { FormField } from '@/src/components/FormField'
import { SubmitButton } from '@/src/components/SubmitButton'
import { useAuth } from '@/src/features/auth/AuthContext'
import { loginFormSchema } from '@/src/features/auth/schemas'

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

const SignInScreen = () => {
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

    // Valid — attempt sign-in via Cognito
    setIsLoading(true)
    try {
      await signIn({ email: result.data.email, password: result.data.password })
    } catch {
      setFormError('Unable to sign in. Please check your credentials and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View className="flex-1 items-center justify-center px-4 bg-white">
      <View className="w-full max-w-120">
        <Text className="text-3xl font-[ManropeBold] text-center mb-2">
          Garden Tracker
        </Text>
        <Text className="text-base font-[ManropeRegular] text-gray-500 text-center mb-8">
          Sign in to manage your gardens
        </Text>

        {formError ? (
          <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            <Text className="text-sm text-red-600 text-center">
              {formError}
            </Text>
          </View>
        ) : null}

        <FormField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={fieldErrors.email}
          required
        />

        <FormField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          error={fieldErrors.password}
          required
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

export { SignInScreen as default }
