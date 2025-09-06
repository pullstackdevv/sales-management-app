
import { Link } from '@inertiajs/react'
import { route } from 'ziggy-js'
import { imageAsset } from '@/utils/asset'

const Logo = () => {
  return (
   <Link href={'/'}>
      <img src={imageAsset('logos/mystock.jpeg')} alt="logo" className="block" />
      </Link>
  )
}

export default Logo
