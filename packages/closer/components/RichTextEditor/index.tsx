import dynamic from 'next/dynamic';

import { useMemo, useRef } from 'react';
import 'react-quill-new/dist/quill.snow.css';

import { uploadPhoto } from '../../utils/uploads';

// Quill 2.0.3 interpolates the video URL into getSemanticHTML unescaped (CVE-2025-15056).
export const registerEscapedVideo = (Quill: any) => {
  const Video = Quill.import('formats/video');
  class EscapedVideo extends Video {
    html() {
      const link = document.createElement('a');
      link.href = this.value().video;
      link.textContent = this.value().video;
      return link.outerHTML;
    }
  }
  Quill.register(EscapedVideo, true);
};

const QuillNoSSRWrapper = dynamic(
  async () => {
    const { default: RQ, Quill } = await import('react-quill-new');
    registerEscapedVideo(Quill);
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

  // Quill 2's getSemanticHTML emits every space as &nbsp;, which stops saved text wrapping, so
  // callers get plain spaces. Quill gets its own HTML back while the value is the one we just
  // emitted: otherwise react-quill sees a different value and reloads the editor on every keystroke.
  const lastEmitted = useRef<{ raw: string; clean: string } | null>(null);
  const last = lastEmitted.current;
  const editorValue = last && last.clean === value ? last.raw : value;

  const handleChange = (html: string) => {
    // Only the last &nbsp; of a run becomes a space, so deliberate runs of spaces still render.
    const clean = html.replace(/&nbsp;(?!&nbsp;)/g, ' ');
    lastEmitted.current = { raw: html, clean };
    onChange(clean);
  };

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
    } = await uploadPhoto(formData);

    insertToEditor(photo.urls[imageSize]);
  }

  function insertToEditor(url: string) {
    if (editorRef.current) {
      const editor = (editorRef.current as any).getEditor();
      if (editor) {
        // getSelection() is null once focus has left the editor (file dialog, slow upload);
        // focusing restores Quill's last range, and with none the image goes at the end.
        const range = editor.getSelection(true);
        editor.insertEmbed(range?.index ?? editor.getLength(), 'image', url);
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
    'link',
    'image',
    'video',
  ];

  return (
    <div className="wysiwyg-editor">
      <QuillNoSSRWrapper
        value={editorValue}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        theme="snow"
        forwardedRef={editorRef}
      />
    </div>
  );
};

export default RichTextEditor;
