export default function BrandHeader({ admin = false, children }) {
  return <header className="brand-header site-width">
    <div className="mme-mark" aria-hidden="true">MME</div>
    <div className="brand-product">
      <strong>Mechanical &amp; Mechatronics Engineering</strong>
      <span>{admin ? 'Lunch administration' : 'Lunch registration'}</span>
    </div>
    {children}
  </header>
}
