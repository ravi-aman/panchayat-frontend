import { PANCHAYAT_BRANDING } from '../config/branding';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 px-6 py-12">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-700 mb-2">{PANCHAYAT_BRANDING.name} Privacy Policy</h1>
          <p className="text-gray-600 mb-2">{PANCHAYAT_BRANDING.tagline}</p>
          <p className="text-sm text-gray-500">Effective Date: September 25, 2025</p>
        </div>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
          <p>
            {PANCHAYAT_BRANDING.name} collects information you provide when you sign in with Google, such as your name,
            email address, and profile picture. We also collect civic issue reports including photos, location data,
            and descriptions to help resolve community problems effectively.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Authenticate you and provide secure access to civic reporting features.</li>
            <li>Route civic issues to appropriate government departments and authorities.</li>
            <li>Display anonymized issue data on public maps for community transparency.</li>
            <li>Improve our civic engagement platform and user experience.</li>
            <li>Communicate with you about issue status updates and platform improvements.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">3. Sharing of Information</h2>
          <p>
            {PANCHAYAT_BRANDING.name} shares civic issue data with relevant government departments and local authorities 
            to facilitate resolution. We display anonymized issue statistics publicly to promote transparency, 
            but do not sell your personal data to third parties.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
          <p>
            We use reasonable security measures to protect your information, but no method of
            transmission over the Internet is 100% secure.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">5. Your Rights</h2>
          <p>
            You can request access, updates, or deletion of your personal data. You may also revoke
            Google access anytime from your{' '}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Google Account permissions
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Contact Us</h2>
          <p>
            If you have questions, please contact us at{' '}
            <a href="mailto:support@neecop.com" className="text-blue-600 underline">
              support@neecop.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
