import { DataGrid, type ColumnDef } from '@sergeyhorse/forge'

import { Preview } from './Preview'

interface Employee {
  id: number
  name: string
  role: string
  location: string
  salary: number
}

const rows: Employee[] = Array.from({ length: 200 }, (_, index) => ({
  id: index + 1,
  name: `Employee ${index + 1}`,
  role: ['Engineer', 'Designer', 'Manager', 'Analyst'][index % 4]!,
  location: ['Berlin', 'Lisbon', 'Tokyo', 'Austin'][index % 4]!,
  salary: 60000 + (index % 40) * 1500,
}))

const columns: ColumnDef<Employee>[] = [
  { id: 'id', header: 'ID', width: 72, frozen: true, align: 'right' },
  { id: 'name', header: 'Name', width: 160, frozen: true },
  { id: 'role', header: 'Role', width: 140 },
  { id: 'location', header: 'Location', width: 140 },
  {
    id: 'salary',
    header: 'Salary',
    width: 120,
    align: 'right',
    accessor: (row) => row.salary,
    cell: (row) => `$${row.salary.toLocaleString('en-US')}`,
  },
]

export function DataGridExample() {
  return (
    <Preview>
      <div className="w-full">
        <DataGrid
          rows={rows}
          columns={columns}
          getRowKey={(row) => row.id}
          height={360}
          sort={{ multiSort: true }}
          selection={{ mode: 'multi' }}
          aria-label="Employees"
        />
      </div>
    </Preview>
  )
}
