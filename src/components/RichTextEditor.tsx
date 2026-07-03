import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Upload,
  Loader2,
  Undo,
  Redo,
  Code,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { uploadBlogImage } from "@/lib/upload-blog-image";
import { toast } from "sonner";
import { ShopifyProductNode } from "@/components/editor/ShopifyProductNode";
import { ShopifyProductPicker } from "@/components/admin/ShopifyProductPicker";
import { AiImageDialog } from "@/components/blog/AiImageDialog";

type Props = {
  value: string;
  onChange: (html: string) => void;
  /** Post title (used for AI image prompt suggestions) */
  title?: string;
};

export function RichTextEditor({ value, onChange, title }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer" } }),
      Image,
      Placeholder.configure({ placeholder: "Write your blog post here..." }),
      ShopifyProductNode,
    ],
    content: value || "",
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-slate max-w-none min-h-[400px] focus:outline-none px-4 py-3",
      },
      handlePaste(view, event) {
        const files = Array.from(event.clipboardData?.files || []).filter((f) => f.type.startsWith("image/"));
        if (files.length === 0) return false;
        event.preventDefault();
        files.forEach((f) => handleUpload(f));
        return true;
      },
      handleDrop(view, event) {
        const files = Array.from((event as DragEvent).dataTransfer?.files || []).filter((f) => f.type.startsWith("image/"));
        if (files.length === 0) return false;
        event.preventDefault();
        files.forEach((f) => handleUpload(f));
        return true;
      },
    },
  });

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const url = await uploadBlogImage(file);
      const alt = (title || file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ")).slice(0, 120);
      editor?.chain().focus().setImage({ src: url, alt }).run();
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  const Btn = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded p-2 transition-colors hover:bg-muted ${active ? "bg-muted text-primary" : ""}`}
    >
      {children}
    </button>
  );

  return (
    <div className="rounded-md border border-input bg-background">
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-1 rounded-t-md border-b border-border bg-background/95 p-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold"><Bold className="h-4 w-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic"><Italic className="h-4 w-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strike"><Strikethrough className="h-4 w-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Code"><Code className="h-4 w-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-border" />
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="H2"><Heading2 className="h-4 w-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="H3"><Heading3 className="h-4 w-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list"><List className="h-4 w-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered list"><ListOrdered className="h-4 w-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Quote"><Quote className="h-4 w-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-border" />
        <Btn
          onClick={() => {
            const url = window.prompt("URL");
            if (url) editor.chain().focus().setLink({ href: url }).run();
            else editor.chain().focus().unsetLink().run();
          }}
          active={editor.isActive("link")}
          title="Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Btn>
        <Btn
          onClick={() => {
            const url = window.prompt("Image URL (or use Upload button)");
            if (!url) return;
            const alt = window.prompt("Alt text (describe the image for SEO & accessibility)", title || "") || "";
            editor.chain().focus().setImage({ src: url, alt }).run();
          }}
          title="Insert image by URL"
        >
          <ImageIcon className="h-4 w-4" />
        </Btn>
        <Btn
          onClick={() => fileInputRef.current?.click()}
          title="Upload image"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        </Btn>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
            e.target.value = "";
          }}
        />
        <span className="mx-1 h-5 w-px bg-border" />
        <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo className="h-4 w-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo className="h-4 w-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-border" />
        <button
          type="button"
          title="Insert Shopify product card"
          onClick={() => setPickerOpen(true)}
          className="flex items-center gap-1 rounded bg-primary/10 px-2 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/20"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          Product
        </button>
        <button
          type="button"
          title="Generate image with AI"
          onClick={() => setAiOpen(true)}
          className="flex items-center gap-1 rounded bg-gradient-to-r from-primary/15 to-primary/5 px-2 py-1.5 text-xs font-medium text-primary transition hover:from-primary/25 hover:to-primary/10"
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI Image
        </button>
      </div>
      <EditorContent editor={editor} />
      <ShopifyProductPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(p) => {
          editor
            .chain()
            .focus()
            .insertContent({
              type: "shopifyProduct",
              attrs: { handle: p.handle, title: p.title },
            })
            .run();
          toast.success(`Inserted "${p.title}"`);
        }}
      />
      <AiImageDialog
        open={aiOpen}
        onOpenChange={setAiOpen}
        title={title}
        contentHtml={editor.getHTML()}
        onGenerated={(url) => {
          editor.chain().focus().setImage({ src: url }).run();
        }}
      />
    </div>
  );
}
