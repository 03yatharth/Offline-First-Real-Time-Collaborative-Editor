import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";

import * as Y from "yjs";

import { SocketIOProvider } from "../collaboration/SocketIOProvider";

import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  List,
  ListOrdered,
  Undo2,
  Redo2,
} from "lucide-react";

interface Props {
  ydoc: Y.Doc;
  provider: SocketIOProvider;
}

export default function TipTapEditor({ ydoc }: Props) {
  const editor = useEditor({
    immediatelyRender: false,

    extensions: [
      StarterKit,

      Collaboration.configure({
        document: ydoc,
      }),
    ],

    editorProps: {
      attributes: {
        class: "editor-area",
      },
    },
  });

  if (!editor) return null;

  function Button({
    children,
    onClick,
    active = false,
  }: {
    children: React.ReactNode;
    onClick: () => void;
    active?: boolean;
  }) {
    return (
      <button
        onClick={onClick}
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: active ? "#2563eb" : "#fff",
          color: active ? "#fff" : "#374151",
          border: "1px solid #d1d5db",
          cursor: "pointer",
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <div className="editor-wrapper">
      <div className="toolbar">
        <Button
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={18} />
        </Button>

        <Button
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={18} />
        </Button>

        <Button
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={18} />
        </Button>

        <Button
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 size={18} />
        </Button>

        <Button
          active={editor.isActive("bulletList")}
          onClick={() =>
            editor.chain().focus().toggleBulletList().run()
          }
        >
          <List size={18} />
        </Button>

        <Button
          active={editor.isActive("orderedList")}
          onClick={() =>
            editor.chain().focus().toggleOrderedList().run()
          }
        >
          <ListOrdered size={18} />
        </Button>

        <div
          style={{
            width: 1,
            background: "#ddd",
            margin: "0 8px",
          }}
        />

        <Button
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 size={18} />
        </Button>

        <Button
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 size={18} />
        </Button>
      </div>

      <div className="editor-container">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}