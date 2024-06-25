import dynamic from 'next/dynamic';

import { useMemo, useRef } from 'react';
import 'react-quill/dist/quill.snow.css';

import api from '../../utils/api';

const QuillNoSSRWrapper = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill');
    return ({ forwardedRef, ...props }: any) => (
      <RQ ref={forwardedRef} {...props} />
    );
  },
  {
    ssr: false,
  },
);

interface Props {
  value: string;
  onChange: (value: string) => void;
  imageSize?: string;
}

const RichTextEditor = ({ value, onChange, imageSize = 'max-lg' }: Props) => {
  const editorRef = useRef(null);

  const toolbarOptions = {
    container: [
      [{ header: '2' }, 'bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image', 'video'],
      ['clean'],
    ],
  };

  const modules = useMemo(() => {
    return {
      toolbar: {
        container: toolbarOptions.container,

        handlers: {
          image: imageHandler,
        },
      },
    };
  }, []);

  function imageHandler() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = () => {
      const file = input?.files?.[0];
      if (file?.type && /^image\//.test(file?.type)) {
        saveToServer(file);
      } else {
        console.warn('You could only upload images.');
      }
    };
  }

  async function saveToServer(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const {
      data: { results: photo },
    } = await api.post('/upload/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    insertToEditor(photo.urls[imageSize]);
  }

  function insertToEditor(url: string) {
    if (editorRef.current) {
      const editor = (editorRef.current as any).getEditor();
      if (editor) {
        const currentPosition = editor.getSelection().index || 0;
        editor.insertEmbed(currentPosition, 'image', url);
      }
    }
  }

  const formats = [
    'header',
    'font',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'link',
    'image',
    'video',
  ];

  return (
    <div>
      <QuillNoSSRWrapper
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        theme="snow"
        forwardedRef={editorRef}
      />
    </div>
  );
};

export default RichTextEditor;
