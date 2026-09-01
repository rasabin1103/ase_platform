import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TiptapImage from '@tiptap/extension-image'
import TiptapLink from '@tiptap/extension-link'
import TiptapUnderline from '@tiptap/extension-underline'
import {
  Bold,
  Code,
  Code2,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo,
  Strikethrough,
  Underline,
  Undo,
} from 'lucide-react'
import { cn } from '../../ui/cn'

type Props = {
  /** Initial content only — this component is meant to be mounted fresh per
   * document (key it by post id / "new") rather than kept alive across
   * different posts, so there's no live external->internal sync to manage. */
  initialContent: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  label,
  children,
}: {
  active?: boolean
  disabled?: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg border text-ase-text2 transition disabled:cursor-not-allowed disabled:opacity-40',
        active
          ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-100'
          : 'border-transparent hover:border-white/10 hover:bg-white/[0.06] hover:text-ase-text',
      )}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({ initialContent, onChange, placeholder, className }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      TiptapLink.configure({ openOnClick: false, autolink: true }),
      TiptapImage.configure({ inline: false }),
      TiptapUnderline,
    ],
    content: initialContent,
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      attributes: {
        class: cn(
          'min-h-[280px] max-w-none px-4 py-3 text-sm text-ase-text outline-none',
          '[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ase-text',
          '[&_h3]:mt-3 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ase-text',
          '[&_p]:mb-3 [&_p]:leading-relaxed [&_p]:text-ase-text2',
          '[&_a]:text-cyan-300 [&_a]:underline [&_a]:decoration-cyan-300/40',
          '[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6',
          '[&_li]:mb-1 [&_li]:text-ase-text2',
          '[&_blockquote]:border-l-2 [&_blockquote]:border-cyan-300/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-ase-muted',
          '[&_code]:rounded [&_code]:bg-white/[0.08] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs',
          '[&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-black/30 [&_pre]:p-3',
          '[&_pre_code]:bg-transparent [&_pre_code]:px-0 [&_pre_code]:py-0',
          '[&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-xl',
          '[&_hr]:my-5 [&_hr]:border-white/10',
        ),
      },
    },
  })

  if (!editor) return null

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]', className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-white/10 bg-white/[0.03] px-2 py-1.5">
        <ToolbarButton label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-white/10" />
        <ToolbarButton
          label="Heading 2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-white/10" />
        <ToolbarButton label="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Code block"
          active={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-white/10" />
        <ToolbarButton
          label="Link"
          active={editor.isActive('link')}
          onClick={() => {
            const previousUrl = editor.getAttributes('link').href as string | undefined
            const url = window.prompt('URL', previousUrl ?? 'https://')
            if (url === null) return
            if (url === '') {
              editor.chain().focus().extendMarkRange('link').unsetLink().run()
              return
            }
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
          }}
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Image (URL)"
          onClick={() => {
            const url = window.prompt('Image URL', 'https://')
            if (!url) return
            editor.chain().focus().setImage({ src: url }).run()
          }}
        >
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-white/10" />
        <ToolbarButton label="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  )
}
