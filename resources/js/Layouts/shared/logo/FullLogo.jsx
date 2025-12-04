import { Link } from "@inertiajs/react";
import { useEffect, useState } from "react";
import api from "@/api/axios";
import { imageAsset } from "@/utils/asset";

const FullLogo = () => {
  const [logoUrl, setLogoUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/general-settings/public");
        if (res.data?.success) {
          setLogoUrl(res.data.data?.site_logo_url || null);
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Link href="/">
      {loading ? (
        <div className="flex items-center justify-center max-h-16">
          <div className="w-8 h-8 border-4 border-gray-300 rounded-full border-t-transparent animate-spin"></div>
        </div>
      ) : (
        <img
          src={logoUrl || imageAsset('logos/logo.png')}
          alt="logo"
          className="block max-h-16"
        />
      )}
    </Link>
  );
};

export default FullLogo;
