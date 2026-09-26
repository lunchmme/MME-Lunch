import roboticsLogo from './assets/rhu-robotics-club.png'
import asmeLogo from './assets/rhu-asme.png'

export default function BrandHeader({ admin = false, children }) {
  return <header className="brand-header site-width">
    <div className="mme-mark" aria-hidden="true">MME</div>
    <div className="brand-product">
      <strong>Mechanical &amp; Mechatronics Engineering</strong>
      <span>{admin ? 'Lunch administration' : 'Lunch registration'}</span>
    </div>
    <div className="brand-logos" aria-label="RHU Robotics and Technology Club and ASME RHU Student Chapter">
      <img src={roboticsLogo} alt="RHU Robotics and Technology Club" />
      <img src={asmeLogo} alt="ASME Rafik Hariri University Student Chapter" />
    </div>
    {children}
  </header>
}
