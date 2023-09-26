import { useState } from 'react';

import RichTextEditor from 'closer/components/RichTextEditor';

const Quill = () => {
  const [text, seTtext] = useState('');
  return (
    <div>
      <RichTextEditor value={text} onChange={(value) => seTtext(value)} />
      {/* <div dangerouslySetInnerHTML={{ __html: text }} /> */}
    </div>
  );
};

export default Quill;
