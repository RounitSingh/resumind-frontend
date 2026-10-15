"use client"

import { ChevronDownIcon, DownloadIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { useExportResume } from "@/hooks/use-api"
import { getErrorMessage } from "@/lib/api"
import type { ExportFormat } from "@/lib/types"
import { saveBlob } from "@/lib/utils"

const FORMATS: { format: ExportFormat; label: string; hint: string }[] = [
  { format: "pdf", label: "PDF", hint: "Best for applying" },
  { format: "docx", label: "Word (DOCX)", hint: "Edit in Word or Google Docs" },
  { format: "txt", label: "Plain text", hint: "Paste into online forms" },
]

export function DownloadMenu({
  id,
  onError,
}: {
  id: string
  onError: (message: string | null) => void
}) {
  const exportResume = useExportResume(id)
  const busy = exportResume.isPending

  async function download(format: ExportFormat) {
    onError(null)
    try {
      const { blob, fileName } = await exportResume.mutateAsync(format)
      saveBlob(blob, fileName)
    } catch (e) {
      onError(getErrorMessage(e))
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button disabled={busy} />}>
        {busy ? <Spinner /> : <DownloadIcon />}
        Download
        <ChevronDownIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {FORMATS.map((f) => (
          <DropdownMenuItem key={f.format} onClick={() => download(f.format)}>
            <div className="flex flex-col">
              <span>{f.label}</span>
              <span className="text-xs text-muted-foreground">{f.hint}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
