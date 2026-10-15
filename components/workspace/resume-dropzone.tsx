"use client"

import { useRef, useState } from "react"
import { FileTextIcon, UploadCloudIcon, XIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useUploadResume } from "@/hooks/use-api"
import { getErrorMessage } from "@/lib/api"
import { cn, formatBytes } from "@/lib/utils"
import { useWorkspaceStore } from "@/store/workspace-store"

const MAX_BYTES = 5 * 1024 * 1024

export function ResumeDropzone() {
  const value = useWorkspaceStore((s) => s.resume)
  const onChange = useWorkspaceStore((s) => s.setResume)
  const upload = useUploadResume()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    if (!/\.(pdf|docx)$/i.test(file.name)) {
      setError("Only PDF and DOCX files are supported.")
      return
    }
    if (file.size > MAX_BYTES) {
      setError("That file is larger than 5 MB.")
      return
    }
    setUploading(file.name)
    try {
      onChange(await upload.mutateAsync(file))
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setUploading(null)
    }
  }

  function pick(files: FileList | null) {
    void handleFile(files?.[0])
    // reset so choosing the same file again still fires
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={(e) => pick(e.target.files)}
      />

      {uploading ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-6 text-sm">
          <Spinner />
          <span className="truncate">Reading {uploading}...</span>
        </div>
      ) : value ? (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
          <FileTextIcon className="size-8 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{value.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(value.fileSize)} &middot;{" "}
              {value.charCount.toLocaleString()} characters read
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            Replace
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove resume"
            onClick={() => {
              onChange(null)
              setError(null)
            }}
          >
            <XIcon />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            pick(e.dataTransfer.files)
          }}
          className={cn(
            "flex flex-col items-center gap-1.5 rounded-lg border border-dashed p-4 text-center text-sm outline-none transition-colors",
            "hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            dragging && "border-primary bg-muted/50"
          )}
        >
          <UploadCloudIcon className="size-8 text-muted-foreground" />
          <span className="font-medium">Drop your resume here</span>
          <span className="text-xs text-muted-foreground">
            or click to browse. PDF or DOCX, up to 5 MB.
          </span>
        </button>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>We couldn&apos;t use that file</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
