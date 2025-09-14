import { Link } from "@inertiajs/react";
import { route } from 'ziggy-js';
import { imageAsset } from '@/utils/asset';

const FullLogo = () => {
  return (
    <Link href="/">
      <img src={imageAsset('logos/mystock.png')} alt="logo" className="block w-40" />
    </Link>
  );
};

export default FullLogo;
