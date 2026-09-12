type Definition = {
  id: string
  label: string
  fieldType: string
  options?: unknown
  isRequired: boolean
}

export function CustomFieldsEditor({
  definitions,
  values,
  onChange,
}: {
  definitions: Definition[]
  values: Record<string, unknown>
  onChange: (values: Record<string, unknown>) => void
}) {
  if (!definitions.length) return null
  const set = (id: string, value: unknown) =>
    onChange({ ...values, [id]: value })
  return (
    <fieldset className="custom-fields">
      <legend>ข้อมูลเพิ่มเติม (เว้นว่างได้ เว้นแต่มี *)</legend>
      {definitions.map((definition) => {
        const value = values[definition.id]
        if (definition.fieldType === 'checkbox')
          return (
            <label className="checkbox-field" key={definition.id}>
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(event) => set(definition.id, event.target.checked)}
              />
              {definition.label}
              {definition.isRequired && ' *'}
            </label>
          )
        if (definition.fieldType === 'select')
          return (
            <label key={definition.id}>
              {definition.label}
              {definition.isRequired && ' *'}
              <select
                required={definition.isRequired}
                value={String(value ?? '')}
                onChange={(event) => set(definition.id, event.target.value)}
              >
                <option value="">เลือก…</option>
                {(Array.isArray(definition.options)
                  ? definition.options
                  : []
                ).map((option) => (
                  <option key={String(option)} value={String(option)}>
                    {String(option)}
                  </option>
                ))}
              </select>
            </label>
          )
        return (
          <label key={definition.id}>
            {definition.label}
            {definition.isRequired && ' *'}
            <input
              required={definition.isRequired}
              type={
                definition.fieldType === 'number'
                  ? 'number'
                  : definition.fieldType === 'date'
                    ? 'date'
                    : 'text'
              }
              value={String(value ?? '')}
              onChange={(event) =>
                set(
                  definition.id,
                  definition.fieldType === 'number'
                    ? event.target.value === ''
                      ? ''
                      : Number(event.target.value)
                    : event.target.value,
                )
              }
            />
          </label>
        )
      })}
    </fieldset>
  )
}
