import React from 'react';
import { EditorInstance as Editor } from 'novel';
import {
  EditorBubble,
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList
} from 'novel';
import { AICommandType } from './ai-command-dialog';
import { NodeSelector } from './node-selector';
import { TextButtons } from './text-buttons';
import { LinkSelector } from './link-selector';
import { Separator } from './separator';
import AIMenu from './ai-menu';
import { suggestionItems, isAICommandEnabled } from './slash-command';

interface EditorUIProps {
  editor: Editor | null;
  aiDialogOpen: boolean;
  showBubbleMenu: boolean;
  openNode: boolean;
  setOpenNode: (open: boolean) => void;
  openLink: boolean;
  setOpenLink: (open: boolean) => void;
  onAICommand: (type: AICommandType) => void;
}

/**
 * Component for editor UI elements like bubble menu and slash commands
 */
export function EditorUI({
  editor,
  aiDialogOpen,
  showBubbleMenu,
  openNode,
  setOpenNode,
  openLink,
  setOpenLink,
  onAICommand
}: EditorUIProps) {
  if (!editor) return null;

  return (
    <>
      {/* Slash Command Menu */}
      <EditorCommand className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-stone-200 bg-white px-1 py-2 shadow-md transition-all">
        <EditorCommandEmpty className="px-2 text-stone-500">
          No results
        </EditorCommandEmpty>
        <EditorCommandList>
          {suggestionItems
            .filter(item => {
              // Filter out disabled AI commands
              if (["Generate Content", "Refine Content", "Summarize Title", "Create Outline"].includes(item.title)) {
                return isAICommandEnabled(item.title, editor);
              }
              return true;
            })
            .map((item) => (
            <EditorCommandItem
              key={item.title}
              value={item.title}
              onCommand={(val) => {
                if (item.command) {
                  item.command(val);
                }
              }}
              className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-stone-100 aria-selected:bg-stone-100"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-200 bg-white">
                {item.icon}
              </div>
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-stone-500">{item.description}</p>
              </div>
            </EditorCommandItem>
          ))}
        </EditorCommandList>
      </EditorCommand>
      
      {/* Bubble Menu - appears when text is selected, hidden when AI dialog is open or disabled */}
      {!aiDialogOpen && showBubbleMenu && (
        <EditorBubble
          className="flex w-fit divide-x divide-stone-200 rounded-md border border-stone-200 bg-white shadow-xl"
          tippyOptions={{ duration: 100 }}
        >
          <AIMenu 
            editor={editor} 
            onGenerateContent={() => onAICommand('generate')} 
            onRefineContent={() => onAICommand('refine')} 
            onSummarizeContent={() => onAICommand('summarize-title')}
          />
          <Separator orientation="vertical" />
          <NodeSelector open={openNode} onOpenChange={setOpenNode} />
          <Separator orientation="vertical" />
          <TextButtons />
          <Separator orientation="vertical" />
          <LinkSelector open={openLink} onOpenChange={setOpenLink} />
        </EditorBubble>
      )}
    </>
  );
}

/**
 * Component for editor status bar (word count, save status)
 */
export function EditorStatusBar({
  wordCount,
  saveStatus
}: {
  wordCount: number | null;
  saveStatus: string;
}) {
  return (
    <div className="flex items-center justify-between p-2 text-sm text-gray-500">
      <div>
        {wordCount !== null && (
          <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
        )}
      </div>
      <div>{saveStatus}</div>
    </div>
  );
}
