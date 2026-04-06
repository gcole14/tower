import { useRef, useState } from 'react'
import Papa from 'papaparse'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { normalizePhone } from './MemberTable'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'

interface MemberImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
}

interface ParsedRow {
  name: string
  phone: string
  group_tag: string | null
  error: string | null
}

const GROUP_TAG_MAP: Record<string, string> = {
  'elders quorum': 'elders_quorum',
  'elders_quorum': 'elders_quorum',
  'eq': 'elders_quorum',
  'm': 'elders_quorum',
  'relief society': 'relief_society',
  'relief_society': 'relief_society',
  'rs': 'relief_society',
  'f': 'relief_society',
}

function parseGroupTag(raw: string): string | null {
  if (!raw) return null
  const normalized = raw.trim().toLowerCase()
  return GROUP_TAG_MAP[normalized] ?? null
}

function validateRow(raw: Record<string, string>, index: number): ParsedRow {
  const name = (raw['name'] ?? raw['Name'] ?? '').trim()
  const rawPhone = (raw['phone'] ?? raw['Phone'] ?? raw['phone_number'] ?? raw['Phone Number'] ?? '').trim()
  const rawGroup = (raw['group'] ?? raw['Group'] ?? raw['group_tag'] ?? raw['Group Tag'] ?? '').trim()
  const rawGender = (raw['gender'] ?? raw['Gender'] ?? raw['sex'] ?? raw['Sex'] ?? '').trim()

  if (!name) return { name, phone: rawPhone, group_tag: null, error: `Row ${index + 1}: missing name` }
  if (!rawPhone) return { name, phone: rawPhone, group_tag: null, error: `Row ${index + 1}: missing phone` }

  const digits = rawPhone.replace(/\D/g, '')
  if (digits.length < 7) return { name, phone: rawPhone, group_tag: null, error: `Row ${index + 1}: invalid phone` }

  return {
    name,
    phone: normalizePhone(rawPhone),
    group_tag: parseGroupTag(rawGroup) ?? parseGroupTag(rawGender),
    error: null,
  }
}

export function MemberImportDialog({ open, onOpenChange, orgId }: MemberImportDialogProps) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)

  const validRows = rows.filter((r) => !r.error)
  const errorRows = rows.filter((r) => r.error)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        setRows(data.map((row, i) => validateRow(row, i)))
      },
    })
  }

  async function handleImport() {
    if (!validRows.length) return
    setImporting(true)

    const { error } = await supabase.from('members').insert(
      validRows.map(({ name, phone, group_tag }) => ({
        org_id: orgId,
        name,
        phone,
        group_tag: group_tag as 'elders_quorum' | 'relief_society' | null,
      }))
    )

    setImporting(false)

    if (error) {
      toast.error(error.message)
      return
    }

    await queryClient.invalidateQueries({ queryKey: ['members', orgId] })
    toast.success(`Imported ${validRows.length} member${validRows.length !== 1 ? 's' : ''}`)
    handleClose()
  }

  function handleClose() {
    setRows([])
    if (fileInputRef.current) fileInputRef.current.value = ''
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-xl max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import members from CSV</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Instructions */}
          <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground flex flex-col gap-1">
            <p>CSV must include <strong className="text-foreground">name</strong> and <strong className="text-foreground">phone</strong> columns.</p>
            <p>Optional: <strong className="text-foreground">group</strong> column (<code className="text-xs bg-muted px-1 py-0.5 rounded">eq</code>/<code className="text-xs bg-muted px-1 py-0.5 rounded">rs</code>) or <strong className="text-foreground">gender</strong> column (<code className="text-xs bg-muted px-1 py-0.5 rounded">M</code> → Elders Quorum, <code className="text-xs bg-muted px-1 py-0.5 rounded">F</code> → Relief Society).</p>
          </div>

          {/* File picker */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:px-3 file:py-1.5 file:text-sm file:font-medium cursor-pointer"
          />

          {/* Preview */}
          {rows.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary">{validRows.length} valid</Badge>
                {errorRows.length > 0 && (
                  <Badge variant="destructive">{errorRows.length} error{errorRows.length !== 1 ? 's' : ''}</Badge>
                )}
              </div>

              <ScrollArea className="h-64 rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => (
                      <TableRow key={i} className={row.error ? 'opacity-50' : ''}>
                        <TableCell>{row.name || <span className="text-muted-foreground italic">missing</span>}</TableCell>
                        <TableCell className="tabular-nums">{row.phone || <span className="text-muted-foreground italic">missing</span>}</TableCell>
                        <TableCell>{row.group_tag?.replace('_', ' ') ?? <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell>
                          {row.error && (
                            <span className="text-xs text-destructive">{row.error.split(': ')[1]}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleImport} disabled={!validRows.length || importing}>
            {importing && <Spinner data-icon="inline-start" className="size-4" />}
            Import {validRows.length > 0 ? `${validRows.length} member${validRows.length !== 1 ? 's' : ''}` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
