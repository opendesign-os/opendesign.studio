import { mountApp } from '@opendesign/app'
import { createNativePlatform } from '@opendesign/platform/native'

createNativePlatform().then((platform) => {
  mountApp('#app', platform)
})
