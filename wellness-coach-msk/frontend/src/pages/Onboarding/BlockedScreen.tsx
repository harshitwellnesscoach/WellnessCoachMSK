export default function BlockedScreen() {
  return (
    <div style={{ maxWidth: 500, margin: '100px auto', padding: 24, textAlign: 'center' }}>
      <h1>Please seek medical attention</h1>
      <p>
        Based on your answers, we recommend contacting your GP or going to your
        nearest emergency department before using this program.
      </p>
      <p>
        If you have any questions, contact us at{' '}
        <a href="mailto:support@wellnesscoach.live">support@wellnesscoach.live</a>
      </p>
    </div>
  )
}