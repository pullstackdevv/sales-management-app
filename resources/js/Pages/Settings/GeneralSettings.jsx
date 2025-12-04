import { useEffect, useState, useRef } from "react";
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
    marketplace_banner_ids: [],
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
          setPreview((prev) => ({
            ...prev,
            site_logo_url: publicRes.data.data?.site_logo_url || null,
            site_icon_url: publicRes.data.data?.site_icon_url || null,
          }));
        }

        const bannersRes = await api.get("/banners");
        if (bannersRes.data?.success) {
          const list = bannersRes.data.data || [];
          setPreview((prev) => ({
            ...prev,
            marketplace_banners: list.map((b) => b.image_url),
            marketplace_banner_ids: list.map((b) => b.id),
          }));
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
      // banners dikelola via modal, bukan di form utama
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

  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [newBannerFiles, setNewBannerFiles] = useState([]);
  const [newBannerPreviews, setNewBannerPreviews] = useState([]);
  const saveOrderTimer = useRef(null);

  const deleteBanner = async (id) => {
    const result = await Swal.fire({
      title: "Hapus banner ini?",
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
      await api.delete(`/banners/${id}`);
      await loadSettings();
      Swal.fire({ icon: "success", title: "Berhasil", text: "Banner dihapus", showConfirmButton: false });
    } catch (e) {
      console.error(e);
      Swal.fire({ icon: "error", title: "Gagal", text: "Tidak bisa menghapus banner" });
    }
  };

  const getImageRatio = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          resolve(img.width / img.height);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const getImageDims = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          resolve({ w: img.width, h: img.height });
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const uploadNewBanners = async () => {
    if (!newBannerFiles.length) {
      setBannerModalOpen(false);
      return;
    }
    setSaving(true);
    try {
      for (const f of newBannerFiles) {
        const { w, h } = await getImageDims(f);
        if (w !== h * 4) {
          setSaving(false);
          Swal.fire({ icon: "error", title: "Gagal", text: "Banner harus memiliki rasio 4:1" });
          return;
        }
      }
      const fd = new FormData();
      newBannerFiles.forEach((f) => fd.append("banners[]", f));
      await api.post("/banners", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setNewBannerFiles([]);
      setBannerModalOpen(false);
      await loadSettings();
      Swal.fire({ icon: "success", title: "Berhasil", text: "Banner ditambahkan", timer: 1200, showConfirmButton: false });
    } catch (e) {
      console.error(e);
      Swal.fire({ icon: "error", title: "Gagal", text: "Upload banner gagal" });
    } finally {
      setSaving(false);
    }
  };

  const moveBannerUp = async (idx) => {
    if (idx <= 0) return;
    const next = (p) => {
      const urls = [...p.marketplace_banners];
      const ids = [...p.marketplace_banner_ids];
      [urls[idx - 1], urls[idx]] = [urls[idx], urls[idx - 1]];
      [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
      return { urls, ids };
    };
    setPreview((p) => {
      const { urls, ids } = next(p);
      if (saveOrderTimer.current) clearTimeout(saveOrderTimer.current);
      saveOrderTimer.current = setTimeout(() => saveBannerOrder(ids), 2000);
      return { ...p, marketplace_banners: urls, marketplace_banner_ids: ids };
    });
  };

  const moveBannerDown = async (idx) => {
    setPreview((p) => {
      if (idx >= p.marketplace_banners.length - 1) return p;
      const urls = [...p.marketplace_banners];
      const ids = [...p.marketplace_banner_ids];
      [urls[idx + 1], urls[idx]] = [urls[idx], urls[idx + 1]];
      [ids[idx + 1], ids[idx]] = [ids[idx], ids[idx + 1]];
      if (saveOrderTimer.current) clearTimeout(saveOrderTimer.current);
      saveOrderTimer.current = setTimeout(() => saveBannerOrder(ids), 2000);
      return { ...p, marketplace_banners: urls, marketplace_banner_ids: ids };
    });
  };

  const saveBannerOrder = async (idsArg) => {
    try {
      const ids = idsArg || preview.marketplace_banner_ids;
      await api.post('/banners/reorder', { ids });
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Urutan banner disimpan', timer: 1200, showConfirmButton: false });
    } catch (e) {
      console.error(e);
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak bisa menyimpan urutan' });
    }
  };

  useEffect(() => {
    return () => {
      if (saveOrderTimer.current) clearTimeout(saveOrderTimer.current);
    };
  }, []);

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
        <div className="card bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-bold mb-2">Logo & Icon</h2>
          {/* Section: Logo & Icon */}
          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <span className="text-sm text-gray-500">Format: JPG, JPEG, PNG</span>
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
                  <span className="text-sm text-gray-500">Format: SVG & ICO</span>
                  <input
                    type="file"
                    accept="image/*,.svg,.ico"
                    onChange={(e) => handleFile("site_icon", e.target.files[0])}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <h2 className="text-lg font-bold">Akun Sosial Media</h2>
            {/* Section: Sosial Media */}
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
                    placeholder="https://wa.me/+62xxxxxxxxxxx"
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
        </div>

        <div className="card bg-gray-50 p-6 rounded-lg">
          {/* Section: Banner - inline manage & reorder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Banner Marketplace (Rasio 4:1)</h3>
              <button type="button" onClick={() => setBannerModalOpen(true)} className="px-3 py-1.5 bg-blue-600 text-white rounded-md">Tambah Banner</button>
            </div>
            {preview.marketplace_banners?.length === 0 && (
              <div className="text-sm text-gray-500">Belum ada banner</div>
            )}
            {preview.marketplace_banners?.length > 0 && (
              <div className="space-y-3">
                {preview.marketplace_banners.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <img src={url} alt={`banner-${idx}`} className="w-[300px] h-[75px] object-cover rounded" />
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => moveBannerUp(idx)} className="px-2 py-1 bg-gray-200 rounded">↑</button>
                      <button type="button" onClick={() => moveBannerDown(idx)} className="px-2 py-1 bg-gray-200 rounded">↓</button>
                      <button type="button" onClick={() => deleteBanner(preview.marketplace_banner_ids[idx])} className="px-3 py-1.5 bg-red-600 text-white rounded">Hapus</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {bannerModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <h3 className="text-lg font-semibold">Tambah Banner Marketplace</h3>
                  <button onClick={() => { setBannerModalOpen(false); setNewBannerFiles([]); newBannerPreviews.forEach(u => URL.revokeObjectURL(u)); setNewBannerPreviews([]); }} className="p-2"><X className="h-5 w-5" /></button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    {newBannerPreviews.length > 0 && (
                      <div className="flex flex-wrap gap-3 mb-3">
                        {newBannerPreviews.map((u, i) => (
                          <img key={i} src={u} alt={`preview-${i}`} className="w-[300px] h-[75px] object-cover rounded" />
                        ))}
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setNewBannerFiles(files);
                        newBannerPreviews.forEach(u => URL.revokeObjectURL(u));
                        setNewBannerPreviews(files.map(f => URL.createObjectURL(f)));
                      }}
                      className="w-full"
                    />
                    <span className="text-sm text-gray-500 mt-1">Format: JPG, JPEG, PNG</span><br />
                    <span className="text-sm text-gray-500 mt-1">Rasio 4:1 (contoh 800x200, 1600x400, dst)</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2 px-4 py-3 border-t">
                  <button onClick={() => { setBannerModalOpen(false); setNewBannerFiles([]); }} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md">Batal</button>
                  <button onClick={async () => { await uploadNewBanners(); newBannerPreviews.forEach(u => URL.revokeObjectURL(u)); setNewBannerPreviews([]); }} className="px-4 py-2 bg-blue-600 text-white rounded-md">Simpan</button>
                </div>
              </div>
            </div>
          )}
        </div>


        {loading && (
          <div className="text-sm text-gray-500">Memuat pengaturan...</div>
        )}
      </div>
    </div>
  );
}
