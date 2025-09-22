const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 px-6 py-12">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-10">
        <h1 className="text-3xl font-bold text-blue-700 mb-6">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Effective Date: September 11, 2025</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">1. Use of Services</h2>
          <p>
            You must be at least 13 years old to use our services. You agree not to misuse our
            platform by attempting to hack, disrupt, or exploit our systems.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">2. Accounts</h2>
          <p>
            You may sign in using Google. You are responsible for keeping your login credentials
            secure and providing accurate information.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">3. Content</h2>
          <p>
            Any content you submit remains yours, but you grant us permission to use it to provide
            our services. You may not upload harmful, illegal, or offensive content.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">4. Service Availability</h2>
          <p>
            We strive to provide reliable services, but we do not guarantee uninterrupted or
            error-free operation.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">5. Limitation of Liability</h2>
          <p>
            We are not liable for damages arising from your use of our services, except as required
            by law.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">6. Changes</h2>
          <p>
            We may update these Terms from time to time. Continued use of our services means you
            accept the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Contact Us</h2>
          <p>
            If you have questions, contact us at{' '}
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

export default TermsOfService;
