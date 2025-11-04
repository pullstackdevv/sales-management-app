import { Editor } from "@tinymce/tinymce-react";
import { useRef } from "react";

export default function TiptapEditor({ value, onChange, error }) {
  const editorRef = useRef(null);

  return (
    <div className={`border rounded-md ${error ? 'border-red-500' : 'border-gray-300'}`}>
      <Editor
        tinymceScriptSrc="/tinymce/tinymce.min.js"
        onInit={(evt, editor) => editorRef.current = editor}
        value={value}
        onEditorChange={onChange}
        init={{
          height: 400,
          menubar: true,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'table', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | formatselect | bold italic underline strikethrough | ' +
            'alignleft aligncenter alignright alignjustify | ' +
            'bullist numlist outdent indent | forecolor backcolor | ' +
            'link | code | fullscreen | help',
          content_style: 'body { font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif; font-size:14px }',
          skin: 'oxide',
          content_css: 'default',
          promotion: false,
          branding: false,
          license_key: 'gpl'
        }}
      />
    </div>
  );
}
