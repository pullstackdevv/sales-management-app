import { Link } from "@inertiajs/react";
import { useEffect, useState } from "react";
import api from "@/api/axios";
import { imageAsset } from "@/utils/asset";

const FullLogo = () => {
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/general-settings/public");
        if (res.data?.success) {
          setLogoUrl(res.data.data?.site_logo_url || null);
        }
      } catch (e) {}
    };
    load();
  }, []);

  return (
    <Link href="/">
      <img
        src={logoUrl}
        alt="logo"
        className="block max-h-16"
      />
    </Link>
  );
};

export default FullLogo;
