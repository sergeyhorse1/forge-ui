import { useState } from 'react'
import { RadioGroup } from '@sergeyhorse/forge'

import { Preview } from './Preview'

const channels = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'push', label: 'Push notification' },
]

export function RadioExample() {
  const [value, setValue] = useState('email')

  return (
    <Preview>
      <RadioGroup items={channels} value={value} onValueChange={setValue} />
    </Preview>
  )
}
