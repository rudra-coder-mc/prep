import { useState, type ReactNode } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { serverAddress } from '../src/server/address'
import { useApp } from '../src/ui/app-state'
import { Button, Heading, Muted, Problem } from '../src/ui/components'
import { colors, radius, space } from '../src/ui/theme'

export default function SignInScreen() {
  const app = useApp()
  const router = useRouter()

  const [address, setAddress] = useState(app.session?.address ?? '')
  const [email, setEmail] = useState(app.session?.user.email ?? '')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  async function submit() {
    const origin = serverAddress(address)
    if (!origin) {
      setProblem('That is not an address. Enter your desktop IP or address (e.g. 192.168.1.5:3000)')
      return
    }
    if (email.trim() === '' || password === '') {
      setProblem('Both the address and the password are needed')
      return
    }

    setBusy(true)
    setProblem(null)
    try {
      await app.signIn(origin, email.trim(), password)
      setPassword('')
      router.replace('/')
    } catch (error) {
      setProblem(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <Heading>Sign in once</Heading>
        <Muted>
          The session lasts thirty days and moves forward every time this phone reaches the server,
          so this should be the only time.
        </Muted>

        <Field label="Server">
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="192.168.1.5:3000"
            placeholderTextColor={colors.faint}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            inputMode="url"
          />
        </Field>

        <Field label="Email">
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.faint}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            inputMode="email"
            textContentType="emailAddress"
          />
        </Field>

        <Field label="Password">
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            textContentType="password"
            onSubmitEditing={() => void submit()}
            returnKeyType="go"
          />
        </Field>

        {problem ? <Problem>{problem}</Problem> : null}

        <Button label="Sign in" onPress={() => void submit()} busy={busy} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  page: { padding: space.xl, gap: space.lg },
  field: { gap: space.xs },
  label: { color: colors.muted, fontSize: 13, fontWeight: '500' },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.control,
    color: colors.fg,
    fontSize: 16,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    minHeight: 48,
  },
})
