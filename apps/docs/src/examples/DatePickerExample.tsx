import { useState } from 'react'
import { DatePicker } from '@sergeyhorse/forge'

import { Preview } from './Preview'

export function DatePickerExample() {
  const [date, setDate] = useState<Date | undefined>()

  return (
    <Preview>
      <div className="w-full max-w-xs">
        <DatePicker
          value={date}
          onValueChange={setDate}
          placeholder="Pick a date"
          aria-label="Date"
        />
      </div>
    </Preview>
  )
}
