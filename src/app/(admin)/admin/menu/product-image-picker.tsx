'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { UploadCloud, Link as LinkIcon, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { uploadProductImageAction } from '../../../actions/catalog.actions';

interface ProductImagePickerProps {
  initialUrl?: string | null;
  name?: string;
}

export function ProductImagePicker({
  initialUrl = '',
  name = 'imageUrl',
}: ProductImagePickerProps) {
  const [mode, setMode] = useState<'upload' | 'url'>(initialUrl?.startsWith('http') ? 'url' : 'upload');
  const [imageUrl, setImageUrl] = useState<string>(initialUrl || '');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploadError(null);
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت)');
      return;
    }

    // Validate MIME
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setUploadError('صيغة الملف غير مدعومة. الصيغ المقبولة: JPEG, PNG, WEBP, AVIF');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadProductImageAction(formData);
      if (!res.success) {
        setUploadError(res.error || 'فشل في رفع الصورة');
        return;
      }
      setImageUrl(res.data.url);
    } catch {
      setUploadError('حدث خطأ أثناء رفع الصورة، يرجى المحاولة ثانية');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const removeImage = () => {
    setImageUrl('');
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      {/* Hidden input submitted with the form */}
      <input type="hidden" name={name} value={imageUrl} />

      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-zinc-800">صورة الصنف</label>
        {/* Toggle Mode */}
        <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-1 text-xs">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition ${
              mode === 'upload' ? 'bg-white text-zinc-900 shadow-2xs font-semibold' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <UploadCloud size={13} />
            <span>رفع من الجهاز</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition ${
              mode === 'url' ? 'bg-white text-zinc-900 shadow-2xs font-semibold' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <LinkIcon size={13} />
            <span>رابط خارجي</span>
          </button>
        </div>
      </div>

      {mode === 'upload' ? (
        /* Upload Area */
        <div className="space-y-2">
          {!imageUrl ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`group flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center transition ${
                dragOver
                  ? 'border-zinc-900 bg-zinc-50'
                  : 'border-zinc-300 bg-white hover:border-zinc-400 hover:bg-zinc-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              {uploading ? (
                <div className="flex flex-col items-center gap-2 text-zinc-600">
                  <Loader2 className="size-6 animate-spin text-zinc-900" />
                  <span className="text-xs font-semibold">جارٍ رفع ومعالجة الصورة...</span>
                </div>
              ) : (
                <>
                  <div className="flex size-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 transition group-hover:bg-zinc-200">
                    <UploadCloud size={20} />
                  </div>
                  <p className="mt-2.5 text-xs font-semibold text-zinc-800">
                    اسحب وأفلت الصورة هنا أو <span className="text-zinc-950 underline underline-offset-2">تصفح ملفاتك</span>
                  </p>
                  <p className="mt-1 text-3xs text-zinc-400">
                    صيغ: PNG, JPG, WEBP, AVIF (الحد الأقصى: 5 ميجابايت)
                  </p>
                </>
              )}
            </div>
          ) : (
            /* Uploaded Preview Card */
            <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50">
                  <Image
                    src={imageUrl}
                    alt="Preview"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 size={13} />
                    <span>تم رفع الصورة بنجاح</span>
                  </div>
                  <p className="mt-0.5 truncate text-3xs text-zinc-400 font-mono" dir="ltr">
                    {imageUrl}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeImage}
                aria-label="حذف الصورة"
                className="grid size-9 shrink-0 place-items-center rounded-xl text-zinc-400 hover:bg-rose-50 hover:text-rose-600 transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* External URL Mode */
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://images.example.com/dish.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="min-h-11 flex-1 rounded-xl border border-zinc-300 bg-white px-3.5 text-xs text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 font-mono"
            />
            {imageUrl && (
              <button
                type="button"
                onClick={removeImage}
                aria-label="مسح الرابط"
                className="grid size-11 shrink-0 place-items-center rounded-xl border border-zinc-200 text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          {imageUrl && (
            <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-2.5">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
                <Image
                  src={imageUrl}
                  alt="Preview"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <div className="text-3xs text-zinc-500">
                <p className="font-semibold text-zinc-700">معاينة حية للرابط</p>
                <p className="truncate max-w-xs font-mono" dir="ltr">{imageUrl}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {uploadError && (
        <p role="alert" className="text-xs font-medium text-rose-600">
          {uploadError}
        </p>
      )}
    </div>
  );
}
