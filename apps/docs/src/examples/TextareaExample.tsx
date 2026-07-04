import { useState } from 'react'
import { Textarea } from '@sergeyhorse/forge'

import { Preview } from './Preview'

export function TextareaExample() {
  const [value, setValue] = useState('')

  return (
    <Preview>
      <div className="w-full max-w-xs">
        <Textarea
          value={value}
          onValueChange={setValue}
          placeholder="Share your feedback…"
          aria-label="Feedback"
        />
      </div>
    </Preview>
  )
}
