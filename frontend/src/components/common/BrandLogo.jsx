import { MAHBER } from '../../constants/mahber'
import '../../styles/brand.css'

export default function BrandLogo ({ size = 36 }) {
  return (
    <img
      className='brand-logo'
      src={MAHBER.logoSmall}
      width={size}
      height={size}
      alt=''
    />
  )
}
