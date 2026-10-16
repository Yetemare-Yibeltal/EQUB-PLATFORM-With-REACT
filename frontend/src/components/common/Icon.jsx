const PATHS = {
  dashboard: (
    <>
      <rect x='3' y='3' width='7' height='9' rx='1' />
      <rect x='14' y='3' width='7' height='5' rx='1' />
      <rect x='14' y='12' width='7' height='9' rx='1' />
      <rect x='3' y='16' width='7' height='5' rx='1' />
    </>
  ),
  bell: (
    <>
      <path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9' />
      <path d='M10.3 21a1.94 1.94 0 0 0 3.4 0' />
    </>
  ),
  user: (
    <>
      <circle cx='12' cy='8' r='4' />
      <path d='M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1' />
    </>
  ),
  settings: (
    <>
      <path d='M4 6h8M16 6h4M4 12h4M12 12h8M4 18h10M18 18h2' />
      <circle cx='14' cy='6' r='2' />
      <circle cx='10' cy='12' r='2' />
      <circle cx='16' cy='18' r='2' />
    </>
  ),
  logout: (
    <>
      <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
      <path d='M16 17l5-5-5-5' />
      <path d='M21 12H9' />
    </>
  ),
  sun: (
    <>
      <circle cx='12' cy='12' r='4' />
      <path d='M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4' />
    </>
  ),
  moon: <path d='M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z' />
}

export default function Icon ({ name, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
      focusable='false'
    >
      {PATHS[name] ?? null}
    </svg>
  )
}
