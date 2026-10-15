import { TerminalIcon } from "lucide-react"

// Brand panel shared by the login and sign up cards.
export function AuthSidePanel({ title, text }: { title: string; text: string }) {
  return (
    <div className="relative hidden flex-col items-center justify-center gap-4 bg-muted p-8 text-center md:flex">
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <TerminalIcon className="size-6" />
      </div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="max-w-xs text-balance text-sm text-muted-foreground">{text}</p>
    </div>
  )
}
