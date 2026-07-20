import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import * as Y from "yjs";
import { SocketIOProvider } from "../collaboration/SocketIOProvider";

import {
  ySyncPlugin,
  yCursorPlugin,
  yUndoPlugin,
} from "y-prosemirror";

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

import { Plugin } from "@tiptap/pm/state";

interface TipTapEditorProps {
  ydoc: Y.Doc;
  provider: SocketIOProvider;
}

export default function TipTapEditor({
  ydoc,
  provider,
}: TipTapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,

    extensions: [StarterKit],

    editorProps: {
      attributes: {
        class: "editor-area",
      },
    },

    onCreate({ editor }) {
      const fragment = ydoc.getXmlFragment("prosemirror");

      const plugins: Plugin[] = [
        ySyncPlugin(fragment),
        yCursorPlugin(provider.awareness),
        yUndoPlugin(),
      ];

      plugins.forEach((plugin) => {
        editor.registerPlugin(plugin);
      });
    },
  });

  function ToolbarButton({
    children,
    onClick,
    active = false,
  }: {
    children: React.ReactNode;
    onClick: () => void;
    active?: boolean;
  }) {
    return (
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          padding: "10px 14px",
        }}
      >
        <button
          onClick={onClick}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: active ? "#2563eb" : "#ffffff",
            color: active ? "#ffffff" : "#374151",
            border: "1px solid #d1d5db",
            cursor: "pointer",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transition: "all .15s ease",
          }}
        >
          {children}
        </button>
      </div>
    );
  }

  if (!editor) {
    return null;
  }

  return (
    <div className="editor-wrapper">
      <div className="toolbar">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={18} />
        </ToolbarButton>

        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={18} />
        </ToolbarButton>

        <ToolbarButton
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={18} />
        </ToolbarButton>

        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 size={18} />
        </ToolbarButton>

        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={18} />
        </ToolbarButton>

        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={18} />
        </ToolbarButton>

        <div
          style={{
            width: 1,
            background: "#ddd",
            margin: "0 8px",
          }}
        />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 size={18} />
        </ToolbarButton>
      </div>

      <div className="editor-container">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}