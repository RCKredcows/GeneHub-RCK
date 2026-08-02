import { baseDomain } from '../../config/tenant'
import './styles.css'

/*
  Privacy policy.

  The content below describes what the application actually does: Supabase for
  auth, database, and file storage; a workspace per operation; an activity log
  that records who did what. Values that depend on the business rather than the
  code live in COMPANY, so they can be set in one place.

  This is a starting draft written from the code. It is not legal advice, and
  it should be reviewed by a lawyer before you rely on it.
*/

const COMPANY = {
  legalName: 'GeneHub',
  lastUpdated: 'August 2, 2026',
}

export default function PrivacyPolicy() {
  const domain = baseDomain()

  return (
    <main className="legal">
      <header className="legal__head">
        <a className="legal__back" href="/">← Back to {domain}</a>
        <h1>Privacy Policy</h1>
        <p className="legal__updated">Last updated {COMPANY.lastUpdated}</p>
      </header>

      <div className="legal__body">
        <section>
          <h2>Who this covers</h2>
          <p>
            {COMPANY.legalName} provides inventory software for livestock breeding operations.
            This policy explains what we collect when you visit {domain} or use a workspace on a{' '}
            {domain} subdomain, and what we do with it.
          </p>
          <p>
            Throughout, <strong>you</strong> means the person using GeneHub, and{' '}
            <strong>your operation</strong> means the business whose workspace you are working in.
          </p>
        </section>

        <section>
          <h2>Two kinds of data, two different roles</h2>
          <p>
            This distinction matters, so it comes first rather than buried in the middle.
          </p>
          <p>
            <strong>Data we hold about you.</strong> Your account details and how you use the
            product. We decide how this is handled, and this policy governs it.
          </p>
          <p>
            <strong>Data your operation puts into its workspace.</strong> Inventory records,
            sires, tanks, supplies, and your own customer records — which may include the names,
            email addresses, and phone numbers of your customers. Your operation decides what goes
            in and how long it stays. We hold and process it on your operation&rsquo;s
            instructions and do not use it for our own purposes. If you are one of those
            customers and want your details corrected or removed, contact the operation you deal
            with; we will assist them, but the records are theirs to change.
          </p>
        </section>

        <section>
          <h2>What we collect</h2>

          <h3>Account information</h3>
          <p>
            Your email address, your name if you provide it, and an authentication credential.
            Passwords are handled by our authentication provider and stored as salted hashes — we
            never see or store your password in readable form.
          </p>

          <h3>Workspace information</h3>
          <p>
            The name and address of your operation&rsquo;s workspace, and which workspace each
            account belongs to. Records are separated by workspace, and an account can only reach
            the workspace it belongs to.
          </p>

          <h3>Content you enter</h3>
          <p>
            Everything your operation records: genetic inventory, sires, storage locations,
            medical and breeding supplies, customers, and any images you upload.
          </p>

          <h3>Activity log</h3>
          <p>
            GeneHub records actions taken in a workspace — what changed, which account made the
            change, and when. This is a core feature rather than analytics: it exists so your
            operation can audit its own records.
          </p>

          <h3>Technical information</h3>
          <p>
            Standard server and security logs, including IP address, browser type, and the pages
            requested. These are used to keep the service running and to investigate abuse.
          </p>

          <h3>Cookies and local storage</h3>
          <p>
            We use browser storage to keep you signed in and to remember interface preferences
            such as theme. We do not use advertising cookies and we do not track you across other
            websites.
          </p>
        </section>

        <section>
          <h2>How we use it</h2>
          <ul>
            <li>To operate the service and show you your workspace</li>
            <li>To authenticate you and keep workspaces separate from each other</li>
            <li>To send service messages such as sign-in links and password resets</li>
            <li>To diagnose faults, maintain security, and prevent abuse</li>
            <li>To meet legal and accounting obligations</li>
          </ul>
          <p>
            We do not sell personal information, and we do not share it with advertisers.
          </p>
        </section>

        <section>
          <h2>Where data is held</h2>
          <p>
            Our providers may store and process data in countries other than yours, including the
            United States. Where required, we rely on appropriate safeguards for those transfers.
          </p>
        </section>

        <section>
          <h2>How long we keep it</h2>
          <p>
            Workspace content is kept for as long as your operation keeps its workspace. If a
            workspace is closed, its content is deleted or anonymised within a reasonable period,
            except where we are required to retain records for legal, tax, or dispute purposes.
            Security logs are kept for a limited period and then discarded.
          </p>
        </section>

        <section>
          <h2>How it is protected</h2>
          <p>
            Traffic is encrypted in transit. Access to workspace records is enforced at the
            database level, so an account cannot read another workspace&rsquo;s records. Access to
            production systems is limited to people who need it.
          </p>
          <p>
            No system is perfectly secure. If a breach affects your personal information, we will
            notify you and any relevant regulator as the law requires.
          </p>
        </section>

        <section>
          <h2>Children</h2>
          <p>
            GeneHub is a business tool and is not directed at children. We do not knowingly
            collect personal information from anyone under 16. If you believe a child has
            provided us information, contact us and we will delete it.
          </p>
        </section>

        <section>
          <h2>Changes to this policy</h2>
          <p>
            If we change this policy we will update the date at the top of this page. For changes
            that materially affect how we handle personal information, we will give notice in the
            product or by email before they take effect.
          </p>
        </section>
      </div>

      <footer className="legal__foot">
        <a href="/">← Back to {domain}</a>
      </footer>
    </main>
  )
}
