import { useLanguage } from '../../hooks/useLanguage'

export default function DataTable ({ columns, rows, rowKey = 'id', caption }) {
  const { t } = useLanguage()
  const keyOf = typeof rowKey === 'function' ? rowKey : row => row[rowKey]
  const translate = value => (typeof value === 'string' ? t(value) : value)

  return (
    <div className='table-wrap'>
      <table className='table'>
        {caption && (
          <caption className='visually-hidden'>{translate(caption)}</caption>
        )}
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.key} scope='col' className={column.className}>
                {translate(column.header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={keyOf(row)}>
              {columns.map(column => (
                <td key={column.key} className={column.className}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
