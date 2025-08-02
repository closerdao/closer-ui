import dynamic from 'next/dynamic';

import { useEffect, useState } from 'react';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

import {
  ContentState,
  EditorState,
  convertToRaw,
} from 'draft-js';
import draftToHtml from 'draftjs-to-html';

const Editor = dynamic(
  () => import('react-draft-wysiwyg').then((module) => module.Editor),
  { ssr: false },
);

const TextEditor = ({ onChange, value }) => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  const uploadImageCallBack = (file) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://api.imgur.com/3/image');
      xhr.setRequestHeader('Authorization', 'Client-ID 9ea3ed43f94b8dd');
      const data = new FormData();
      data.append('image', file);
      xhr.send(data);
      xhr.addEventListener('load', () => {
        const response = JSON.parse(xhr.responseText);
        resolve(response);
      });
      xhr.addEventListener('error', () => {
        const error = JSON.parse(xhr.responseText);
        console.log(error);
        reject(error);
      });
    });
  };

  // const dynamicImportFunc = async () => {
  //   if (typeof window !== 'undefined') {
  //     const { default: htmlToDraft } = await import('html-to-draftjs');
  //     const contentBlock = htmlToDraft(value);
  //     if (contentBlock) {
  //       const contentState = ContentState.createFromBlockArray(
  //         contentBlock.contentBlocks
  //       );
  //       const editorState = EditorState.createWithContent(contentState);
  //       setEditorState(editorState);
  //     }
  //   }
  // };

  const dynamicImportFunc = async () => {
    try {
      const { default: htmlToDraft } = await import('html-to-draftjs');
      const blocksFromHtml = htmlToDraft(value);
      const { contentBlocks, entityMap } = blocksFromHtml;
      const contentState = ContentState.createFromBlockArray(
        contentBlocks,
        entityMap,
      );
      const editorState = EditorState.createWithContent(contentState);
      setEditorState(editorState);
    } catch (error) {
      console.error('Error loading html-to-draftjs:', error);
      // Fallback to empty editor state
      setEditorState(EditorState.createEmpty());
    }
  };

  useEffect(() => {
    if (value) {
      dynamicImportFunc();
    }
  }, [value]);

  const onEditorStateChange = (update) => {
    setEditorState(update);
    const html = draftToHtml(convertToRaw(editorState.getCurrentContent()));
    onEditorStateChange && onChange(html);
  };

  return (
    <>
      <Editor
        editorState={editorState}
        toolbarClassName="toolbarClassName"
        wrapperClassName="wrapperClassName"
        editorClassName="editorClassName"
        toolbarStyle={{ background: '#F8FAFC' }}
        onEditorStateChange={onEditorStateChange}
        toolbar={{
          inline: { inDropdown: true },
          list: { inDropdown: true },
          textAlign: { inDropdown: true },
          link: { inDropdown: true },
          history: { inDropdown: true },
          image: {
            uploadCallback: uploadImageCallBack,
            alt: { present: true, mandatory: true },
          },
        }}
      />
    </>
  );
};
export default TextEditor;
