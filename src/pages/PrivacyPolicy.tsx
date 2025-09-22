const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 px-6 py-12">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-10">
        <h1 className="text-3xl font-bold text-blue-700 mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Effective Date: September 11, 2025</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
          <p>
            We collect information you provide when you sign in with Google, such as your name,
            email address, and profile picture. We may also collect usage data about how you
            interact with our services.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Authenticate you and provide login access.</li>
            <li>Improve our services and user experience.</li>
            <li>Communicate with you about updates or support.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">3. Sharing of Information</h2>
          <p>
            We do not sell or share your data, except when required by law or when working with
            trusted service providers who help us operate our services.
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
