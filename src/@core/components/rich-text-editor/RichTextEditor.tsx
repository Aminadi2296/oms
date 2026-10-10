'use client'

import { useRef } from 'react'

import type { Control } from 'react-hook-form'
import { useController } from 'react-hook-form'
import FormatBoldIcon from '@mui/icons-material/FormatBold'
import FormatItalicIcon from '@mui/icons-material/FormatItalic'
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered'
import type { RichTextEditorRef } from 'mui-tiptap'
import { RichTextEditor, MenuBar, MenuControlsContainer, MenuButton, MenuDivider } from 'mui-tiptap'
import { StarterKit } from '@tiptap/starter-kit'
import { Underline } from '@tiptap/extension-underline'

interface Props {
  name: string
  control: Control<any>
}

const RichTextEditorComponent = ({ name, control }: Props) => {
  const { field } = useController({ name, control })
  const rteRef = useRef<RichTextEditorRef>(null)

  return (
    <RichTextEditor
      sx={{
        '& .ProseMirror': {
          minHeight: 150,
          '& ol': {
            paddingInlineStart: '1.5rem'
          }
        }
      }}
      ref={rteRef}
      extensions={[StarterKit, Underline]}
      content={field.value}
      onUpdate={({ editor }) => {
        field.onChange(editor.getHTML())
      }}
      renderControls={() => (
        <MenuBar>
          <MenuControlsContainer>
            <MenuButton
              value='bold'
              tooltipLabel='Bold'
              size='small'
              onClick={() => rteRef.current?.editor?.chain().focus().toggleBold().run()}
              selected={rteRef.current?.editor?.isActive('bold')}
            >
              <FormatBoldIcon />
            </MenuButton>
            <MenuButton
              value='italic'
              tooltipLabel='Italic'
              size='small'
              onClick={() => rteRef.current?.editor?.chain().focus().toggleItalic().run()}
              selected={rteRef.current?.editor?.isActive('italic')}
            >
              <FormatItalicIcon />
            </MenuButton>
            <MenuButton
              value='underline'
              tooltipLabel='Underline'
              size='small'
              onClick={() => rteRef.current?.editor?.chain().focus().toggleUnderline().run()}
              selected={rteRef.current?.editor?.isActive('underline')}
            >
              <FormatUnderlinedIcon />
            </MenuButton>
            <MenuDivider />
            <MenuButton
              value='bulletList'
              tooltipLabel='Bullet List'
              size='small'
              onClick={() => rteRef.current?.editor?.chain().focus().toggleBulletList().run()}
              selected={rteRef.current?.editor?.isActive('bulletList')}
            >
              <FormatListBulletedIcon />
            </MenuButton>
            <MenuButton
              value='orderedList'
              tooltipLabel='Ordered List'
              size='small'
              onClick={() => rteRef.current?.editor?.chain().focus().toggleOrderedList().run()}
              selected={rteRef.current?.editor?.isActive('orderedList')}
            >
              <FormatListNumberedIcon />
            </MenuButton>
          </MenuControlsContainer>
        </MenuBar>
      )}
    />
  )
}

export default RichTextEditorComponent
