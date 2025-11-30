import { useEffect, useState } from "react";
import api from "@/api/axios";
import { X, Trash2 } from "lucide-react";
import Swal from "sweetalert2";

export default function GeneralSettings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState({
    site_logo_url: null,
    site_icon_url: null,
    marketplace_banners: [],
  });
  const [form, setForm] = useState({
    social_facebook_url: "",
    social_instagram_url: "",
    social_twitter_url: "",
    social_youtube_url: "",
    social_tiktok_url: "",
    social_whatsapp_url: "",
    site_logo: null,
    site_icon: null,
    marketplace_banner: null,
  });

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/general-settings");
      if (res.data?.success) {
        const list = res.data.data || [];
        const map = {};
        list.forEach((item) => {
          map[item.setting_name] = item.setting_value;
        });
        setForm((prev) => ({
          ...prev,
          social_facebook_url: map["social_facebook_url"] || "",
          social_instagram_url: map["social_instagram_url"] || "",
          social_twitter_url: map["social_twitter_url"] || "",
          social_youtube_url: map["social_youtube_url"] || "",
          social_tiktok_url: map["social_tiktok_url"] || "",
          social_whatsapp_url: map["social_whatsapp_url"] || "",
        }));
        const publicRes = await api.get("/general-settings/public");
        if (publicRes.data?.success) {
          setPreview({
            site_logo_url: publicRes.data.data?.site_logo_url || null,
            site_icon_url: publicRes.data.data?.site_icon_url || null,
            marketplace_banners: publicRes.data.data?.marketplace_banners || [],
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleFile = (key, file) => {
    setForm((prev) => ({ ...prev, [key]: file }));
    if (file) {
      const url = URL.createObjectURL(file);
      if (key === "site_logo") setPreview((p) => ({ ...p, site_logo_url: url }));
      if (key === "site_icon") setPreview((p) => ({ ...p, site_icon_url: url }));
      if (key === "marketplace_banners") setPreview((p) => ({ ...p, marketplace_banners: [...p.marketplace_banners, url] }));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      [
        "social_facebook_url",
        "social_instagram_url",
        "social_twitter_url",
        "social_youtube_url",
        "social_tiktok_url",
        "social_whatsapp_url",
      ].forEach((k) => {
        if (form[k] !== undefined && form[k] !== null) fd.append(k, form[k]);
      });
      if (form.site_logo) fd.append("site_logo", form.site_logo);
      if (form.site_icon) fd.append("site_icon", form.site_icon);
      if (Array.isArray(form.marketplace_banners)) {
        form.marketplace_banners.forEach((f) => fd.append("marketplace_banners[]", f));
      }
      await api.post("/general-settings/upsert", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await loadSettings();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const deleteSetting = async (settingName, label) => {
    const result = await Swal.fire({
      title: `Hapus ${label}?`,
      text: "Aksi ini tidak bisa dibatalkan",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/general-settings/${settingName}`);
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: `${label} dihapus`,
        timer: 1500,
        showConfirmButton: false,
      });
      await loadSettings();
    } catch (e) {
      console.error(e);
      Swal.fire({ icon: "error", title: "Gagal", text: `Tidak bisa menghapus ${label}` });
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Pengaturan Umum</h2>
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <form onSubmit={submit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Logo</label>
                <button
                  type="button"
                  disabled={!preview.site_logo_url}
                  onClick={() => deleteSetting("site_logo_path", "Logo")}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                  title="Hapus logo"
                >
                  <Trash2 className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              {preview.site_logo_url && (
                <img src={preview.site_logo_url} alt="logo" className="h-16 mb-2 object-contain" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFile("site_logo", e.target.files[0])}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Icon Web</label>
                <button
                  type="button"
                  disabled={!preview.site_icon_url}
                  onClick={() => deleteSetting("site_icon_path", "Icon Web")}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                  title="Hapus icon"
                >
                  <Trash2 className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              {preview.site_icon_url && (
                <img src={preview.site_icon_url} alt="icon" className="h-12 mb-2 object-contain" />
              )}
              <input
                type="file"
                accept="image/*,.svg,.ico"
                onChange={(e) => handleFile("site_icon", e.target.files[0])}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Banner Marketplace (800x200) - Bisa banyak</label>
              </div>
              {preview.marketplace_banners?.length > 0 && (
                <div className="flex gap-3 overflow-x-auto py-2">
                  {preview.marketplace_banners.map((url, idx) => (
                    <img key={idx} src={url} alt={`banner-${idx}`} className="w-[200px] h-[50px] object-cover rounded" />
                  ))}
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setForm((prev) => ({ ...prev, marketplace_banners: files }));
                  setPreview((p) => ({ ...p, marketplace_banners: [...p.marketplace_banners, ...files.map(f => URL.createObjectURL(f))] }));
                }}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium mb-1">Facebook</label>
              <input
                type="url"
                value={form.social_facebook_url}
                onChange={(e) => setForm((p) => ({ ...p, social_facebook_url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="https://facebook.com/akun"
              />
              <button
                type="button"
                onClick={() => deleteSetting("social_facebook_url", "Facebook URL")}
                className="absolute right-2 top-8 p-1 rounded hover:bg-gray-100"
                title="Hapus"
              >
                <Trash2 className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium mb-1">Instagram</label>
              <input
                type="url"
                value={form.social_instagram_url}
                onChange={(e) => setForm((p) => ({ ...p, social_instagram_url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="https://instagram.com/akun"
              />
              <button
                type="button"
                onClick={() => deleteSetting("social_instagram_url", "Instagram URL")}
                className="absolute right-2 top-8 p-1 rounded hover:bg-gray-100"
                title="Hapus"
              >
                <Trash2 className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium mb-1">Twitter</label>
              <input
                type="url"
                value={form.social_twitter_url}
                onChange={(e) => setForm((p) => ({ ...p, social_twitter_url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="https://twitter.com/akun"
              />
              <button
                type="button"
                onClick={() => deleteSetting("social_twitter_url", "Twitter URL")}
                className="absolute right-2 top-8 p-1 rounded hover:bg-gray-100"
                title="Hapus"
              >
                <Trash2 className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium mb-1">YouTube</label>
              <input
                type="url"
                value={form.social_youtube_url}
                onChange={(e) => setForm((p) => ({ ...p, social_youtube_url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="https://youtube.com/akun"
              />
              <button
                type="button"
                onClick={() => deleteSetting("social_youtube_url", "YouTube URL")}
                className="absolute right-2 top-8 p-1 rounded hover:bg-gray-100"
                title="Hapus"
              >
                <Trash2 className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium mb-1">TikTok</label>
              <input
                type="url"
                value={form.social_tiktok_url}
                onChange={(e) => setForm((p) => ({ ...p, social_tiktok_url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="https://tiktok.com/@akun"
              />
              <button
                type="button"
                onClick={() => deleteSetting("social_tiktok_url", "TikTok URL")}
                className="absolute right-2 top-8 p-1 rounded hover:bg-gray-100"
                title="Hapus"
              >
                <Trash2 className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium mb-1">WhatsApp</label>
              <div>
                <input
                  type="url"
                  value={form.social_whatsapp_url}
                  onChange={(e) => setForm((p) => ({ ...p, social_whatsapp_url: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="https://wa.me/nomor"
                />
              <button
                type="button"
                onClick={() => deleteSetting("social_whatsapp_url", "WhatsApp URL")}
                className="absolute right-2 top-8 p-1 rounded hover:bg-gray-100"
                title="Hapus"
              >
                <Trash2 className="h-4 w-4 text-gray-600" />
              </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          </div>
        </form>
        {loading && (
          <div className="text-sm text-gray-500">Memuat pengaturan...</div>
        )}
      </div>
    </div>
  );
}
