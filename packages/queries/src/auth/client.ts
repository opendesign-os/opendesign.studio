import { organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/vue'

export const auth = createAuthClient({ plugins: [organizationClient()] })
