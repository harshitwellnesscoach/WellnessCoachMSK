import Logo from '../../components/Logo'

export default function BlockedScreen() {
  return (
    <div className="page-auth">
      <div style={{ marginBottom: 32 }}>
        <Logo />
      </div>

      <div className="card" style={{ textAlign: 'center', maxWidth: 500 }}>
        <div className="blocked-icon">!</div>

        <h1 style={{ marginBottom: 12 }}>Please seek medical attention</h1>
        <p style={{ marginBottom: 20, lineHeight: 1.65 }}>
          Based on your answers, we recommend contacting your GP or going to your
          nearest emergency department <strong>before</strong> using this programme.
        </p>

        <div className="alert alert-warn" style={{ textAlign: 'left', marginBottom: 24 }}>
          If you are in immediate danger or severe pain, call <strong>999</strong> or go to A&amp;E now.
        </div>

        <p style={{ fontSize: 14 }}>
          Questions?{' '}
          <a href="mailto:support@wellnesscoach.live">support@wellnesscoach.live</a>
        </p>
      </div>
    </div>
  )
}