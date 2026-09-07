import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Eraser,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Redo2,
  Strikethrough,
  Table2,
  Underline,
  Undo2,
  Unlink,
} from 'lucide-react'
import { api } from '../lib/api'

const builtInVariables = [
  ['ชื่อเจ้าของ', 'landlord_name'],
  ['ชื่อผู้เช่า', 'tenant_full_name'],
  ['ชื่อยูนิต', 'unit_title'],
  ['ที่อยู่ยูนิต', 'unit_address'],
  ['วันเริ่มสัญญา', 'agreement_start_date'],
  ['วันสิ้นสุด', 'agreement_end_date'],
  ['ค่าเช่า', 'rent_amount'],
  ['รอบค่าเช่า', 'rent_interval'],
  ['เงินประกัน', 'security_deposit'],
]

const sample = {
  landlord_name: 'สมชาย ใจดี',
  tenant_full_name: 'วิภา รุ่งเรือง',
  unit_title: 'บ้านสุขุมวิท 24',
  unit_address: 'กรุงเทพมหานคร',
  agreement_start_date: '1 ตุลาคม 2569',
  agreement_end_date: '30 กันยายน 2570',
  rent_amount: '18,000.00',
  rent_interval: 'รายเดือน',
  security_deposit: '36,000.00',
}

const fontSizes: Record<string, string> = {
  '1': '8pt',
  '2': '10pt',
  '3': '12pt',
  '4': '14pt',
  '5': '18pt',
  '6': '24pt',
  '7': '36pt',
}

function ToolbarButton({
  title,
  onClick,
  children,
}: {
  title: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className="editor-tool-button"
      title={title}
      aria-label={title}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({
  value,
  onChange,
  labelledBy,
}: {
  value: string
  onChange: (value: string) => void
  labelledBy?: string
}) {
  const editor = useRef<HTMLDivElement>(null)
  const savedSelection = useRef<Range | null>(null)
  const [preview, setPreview] = useState('')
  const [previewError, setPreviewError] = useState('')
  const [variables, setVariables] = useState(builtInVariables)

  useEffect(() => {
    if (editor.current && editor.current.innerHTML !== value)
      editor.current.innerHTML = value
  }, [value])

  useEffect(() => {
    api<any>('/custom-fields?pageSize=100')
      .then((result) =>
        setVariables([
          ...builtInVariables,
          ...result.items.map((field: any) => [
            `${field.label} (${field.scope})`,
            `${field.scope}.custom.${field.key}`,
          ]),
        ]),
      )
      .catch(() => undefined)
  }, [])

  const rememberSelection = () => {
    const current = window.getSelection()
    if (current?.rangeCount && editor.current?.contains(current.anchorNode))
      savedSelection.current = current.getRangeAt(0).cloneRange()
  }

  const restoreSelection = () => {
    editor.current?.focus()
    if (!savedSelection.current) return
    const current = window.getSelection()
    current?.removeAllRanges()
    current?.addRange(savedSelection.current)
  }

  const normalizeMarkup = () => {
    if (!editor.current) return
    editor.current.querySelectorAll('font').forEach((font) => {
      const span = document.createElement('span')
      const size = font.getAttribute('size')
      const face = font.getAttribute('face')
      const color = font.getAttribute('color')
      if (size && fontSizes[size]) span.style.fontSize = fontSizes[size]
      if (face) span.style.fontFamily = face
      if (color) span.style.color = color
      while (font.firstChild) span.appendChild(font.firstChild)
      font.replaceWith(span)
    })
  }

  const sync = () => {
    normalizeMarkup()
    onChange(editor.current?.innerHTML ?? '')
    rememberSelection()
  }

  const command = (name: string, argument?: string) => {
    restoreSelection()
    document.execCommand(name, false, argument)
    sync()
  }

  const createLink = () => {
    const url = window.prompt('ใส่ URL ของลิงก์', 'https://')?.trim()
    if (url && url !== 'https://') command('createLink', url)
  }

  const insertTable = () =>
    command(
      'insertHTML',
      '<table><tbody><tr><td><br></td><td><br></td></tr><tr><td><br></td><td><br></td></tr></tbody></table><p><br></p>',
    )

  async function showPreview() {
    try {
      setPreviewError('')
      const result = await api<{ html: string }>(
        '/agreement-template-preview',
        {
          method: 'POST',
          body: JSON.stringify({
            contentHtml: editor.current?.innerHTML ?? '',
            data: sample,
          }),
        },
      )
      setPreview(result.html)
    } catch (error) {
      setPreviewError(
        error instanceof Error ? error.message : 'ไม่สามารถแสดงตัวอย่างได้',
      )
    }
  }

  return (
    <div className="rich-editor">
      <div
        className="editor-toolbar"
        role="toolbar"
        aria-label="จัดรูปแบบเอกสาร"
      >
        <div className="editor-tool-group">
          <ToolbarButton title="เลิกทำ" onClick={() => command('undo')}>
            <Undo2 size={17} />
          </ToolbarButton>
          <ToolbarButton title="ทำซ้ำ" onClick={() => command('redo')}>
            <Redo2 size={17} />
          </ToolbarButton>
        </div>

        <div className="editor-tool-group editor-format-selects">
          <select
            aria-label="รูปแบบย่อหน้า"
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) command('formatBlock', event.target.value)
              event.target.value = ''
            }}
          >
            <option value="">รูปแบบ</option>
            <option value="p">ข้อความปกติ</option>
            <option value="h1">หัวเรื่อง 1</option>
            <option value="h2">หัวเรื่อง 2</option>
            <option value="h3">หัวเรื่อง 3</option>
            <option value="blockquote">ข้อความอ้างอิง</option>
          </select>
          <select
            aria-label="แบบอักษร"
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) command('fontName', event.target.value)
              event.target.value = ''
            }}
          >
            <option value="">แบบอักษร</option>
            <option value="Google Sans">Google Sans</option>
            <option value="Sarabun">Sarabun</option>
            <option value="TH Sarabun New">TH Sarabun New</option>
            <option value="Arial">Arial</option>
            <option value="Tahoma">Tahoma</option>
            <option value="Times New Roman">Times New Roman</option>
          </select>
          <select
            aria-label="ขนาดตัวอักษร"
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) command('fontSize', event.target.value)
              event.target.value = ''
            }}
          >
            <option value="">ขนาด</option>
            <option value="1">8 pt</option>
            <option value="2">10 pt</option>
            <option value="3">12 pt</option>
            <option value="4">14 pt</option>
            <option value="5">18 pt</option>
            <option value="6">24 pt</option>
            <option value="7">36 pt</option>
          </select>
        </div>

        <div className="editor-tool-group">
          <ToolbarButton title="ตัวหนา" onClick={() => command('bold')}>
            <Bold size={17} />
          </ToolbarButton>
          <ToolbarButton title="ตัวเอียง" onClick={() => command('italic')}>
            <Italic size={17} />
          </ToolbarButton>
          <ToolbarButton
            title="ขีดเส้นใต้"
            onClick={() => command('underline')}
          >
            <Underline size={17} />
          </ToolbarButton>
          <ToolbarButton
            title="ขีดฆ่า"
            onClick={() => command('strikeThrough')}
          >
            <Strikethrough size={17} />
          </ToolbarButton>
          <label className="editor-color-tool" title="สีตัวอักษร">
            A
            <input
              type="color"
              aria-label="สีตัวอักษร"
              defaultValue="#1f2933"
              onChange={(event) => command('foreColor', event.target.value)}
            />
          </label>
          <label
            className="editor-color-tool editor-highlight-tool"
            title="สีเน้นข้อความ"
          >
            A
            <input
              type="color"
              aria-label="สีเน้นข้อความ"
              defaultValue="#fff2a8"
              onChange={(event) => command('hiliteColor', event.target.value)}
            />
          </label>
        </div>

        <div className="editor-tool-group">
          <ToolbarButton title="ชิดซ้าย" onClick={() => command('justifyLeft')}>
            <AlignLeft size={17} />
          </ToolbarButton>
          <ToolbarButton
            title="กึ่งกลาง"
            onClick={() => command('justifyCenter')}
          >
            <AlignCenter size={17} />
          </ToolbarButton>
          <ToolbarButton title="ชิดขวา" onClick={() => command('justifyRight')}>
            <AlignRight size={17} />
          </ToolbarButton>
          <ToolbarButton title="เต็มแนว" onClick={() => command('justifyFull')}>
            <AlignJustify size={17} />
          </ToolbarButton>
        </div>

        <div className="editor-tool-group">
          <ToolbarButton
            title="รายการหัวข้อ"
            onClick={() => command('insertUnorderedList')}
          >
            <List size={17} />
          </ToolbarButton>
          <ToolbarButton
            title="รายการลำดับเลข"
            onClick={() => command('insertOrderedList')}
          >
            <ListOrdered size={17} />
          </ToolbarButton>
          <ToolbarButton title="ลดย่อหน้า" onClick={() => command('outdent')}>
            <IndentDecrease size={17} />
          </ToolbarButton>
          <ToolbarButton title="เพิ่มย่อหน้า" onClick={() => command('indent')}>
            <IndentIncrease size={17} />
          </ToolbarButton>
        </div>

        <div className="editor-tool-group">
          <ToolbarButton title="เพิ่มลิงก์" onClick={createLink}>
            <Link2 size={17} />
          </ToolbarButton>
          <ToolbarButton title="ยกเลิกลิงก์" onClick={() => command('unlink')}>
            <Unlink size={17} />
          </ToolbarButton>
          <ToolbarButton
            title="เส้นคั่น"
            onClick={() => command('insertHorizontalRule')}
          >
            <Minus size={17} />
          </ToolbarButton>
          <ToolbarButton title="แทรกตาราง 2 × 2" onClick={insertTable}>
            <Table2 size={17} />
          </ToolbarButton>
          <ToolbarButton
            title="ล้างรูปแบบ"
            onClick={() => command('removeFormat')}
          >
            <Eraser size={17} />
          </ToolbarButton>
        </div>

        <select
          className="editor-variable-select"
          aria-label="แทรกตัวแปร"
          defaultValue=""
          onChange={(event) => {
            if (event.target.value)
              command('insertText', `{{${event.target.value}}}`)
            event.target.value = ''
          }}
        >
          <option value="">แทรกตัวแปร…</option>
          {variables.map(([label, token]) => (
            <option key={token} value={token}>
              {label}
            </option>
          ))}
        </select>
        <button type="button" className="preview-button" onClick={showPreview}>
          แสดงตัวอย่าง
        </button>
      </div>

      <div className="editor-document">
        <div
          ref={editor}
          className="editor-surface"
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-labelledby={labelledBy}
          data-placeholder="เริ่มพิมพ์เนื้อหาสัญญา…"
          onInput={sync}
          onBlur={rememberSelection}
          onKeyUp={rememberSelection}
          onMouseUp={rememberSelection}
        />
      </div>
      {previewError && <div className="error-box">{previewError}</div>}
      {preview && (
        <div className="template-preview">
          <strong>ตัวอย่างสัญญา</strong>
          <article dangerouslySetInnerHTML={{ __html: preview }} />
        </div>
      )}
    </div>
  )
}
