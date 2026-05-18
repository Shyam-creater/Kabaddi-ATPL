

const PrivacyPolicy = () => {
  const sections = [
    {
      title: 'Information We Collect',
      content: `We collect information to provide better services to our users. The types of information we collect include:

• Personal Information: Name, email address, phone number, profile picture, date of birth, and location (City/State provided by you).
• Sports Profile: Sports preferences, playing statistics, team affiliations, match history, and achievements.
• Device Information: Device model, operating system version, unique device identifiers, and mobile network information.
• Usage Data: Information about how you use the app, such as features accessed and time spent.`
    },
    {
      title: 'Permissions & Sensitive Data',
      content: `To provide certain features, our app requires access to the following sensitive information and device features:

• Camera: Used for scanning QR codes and taking profile pictures.
• Photo Library: Used to allow you to upload profile pictures and sports-related media.
• Microphone: Used for voice-enabled features and search within the app.
• Storage: Used to save app-related data and cache images for better performance.

We only access these features with your explicit permission, and you can revoke access at any time through your device settings.`
    },
    {
      title: 'How We Use Your Information',
      content: `We use the information we collect to:

• Provide, maintain, and improve our sports scoring and community services.
• Create and manage your player profile and match history.
• Facilitate connections between players, teams, and tournament organizers.
• Send important notifications regarding matches, events, and account updates.
• Analyze app usage to enhance user experience and detect fraudulent activities.`
    },
    {
      title: 'Information Sharing & Disclosure',
      content: `We value your privacy and do not sell your personal information to third parties. Information may be shared in the following cases:

• Public Profile: Certain information (name, sports stats) is visible to other users as part of the community features.
• Tournament Organizers: Data is shared with organizers when you register for specific events.
• Service Providers: We work with trusted third-party providers (e.g., hosting, analytics) who assist us in operating our app.
• Legal Requirements: We may disclose information if required by law or to protect the safety and rights of our users.`
    },
    {
      title: 'Data Security',
      content: `We implement industry-standard security measures to protect your data:

• SSL/TLS encryption for data transmission.
• Secure server infrastructure with restricted access.
• Regular security monitoring and vulnerability assessments.
• Multi-factor authentication for sensitive account actions.`
    },
    {
      title: 'Data Retention and Deletion',
      content: `We retain your personal data only for as long as necessary to fulfill the purposes outlined in this policy.

• Account Deletion: You can request the deletion of your account and all associated personal data at any time through the app settings or by contacting us.
• Request via Email: To request data deletion, please email us at AdminAattumTpl@gmail.com.
• Processing Time: Upon receiving a request, we will delete your data from our active systems within 7-30 business days.
• Legal Retention: Some data may be retained if required for legal, audit, or regulatory compliance.`
    },
    {
      title: 'Your Rights & Choices',
      content: `You have full control over your data:

• Access & Update: You can review and edit your profile information at any time within the app.
• Data Portability: You may request a copy of the personal data we hold about you.
• Consent Withdrawal: You can opt-out of notifications or revoke device permissions at any time.

To exercise any of these rights, please contact our data protection team at AdminAattumTpl@gmail.com.`
    },
    {
      title: 'Children\'s Privacy',
      content: `Aattum TPL is committed to protecting the privacy of children:

• Users under 13 require verifiable parental consent to use the app.
• We do not knowingly collect personal data from children under 13 without such consent.
• Parents have the right to review, edit, or request deletion of their child's information.
• We comply with the Children's Online Privacy Protection Act (COPPA).`
    },
    {
      title: 'Changes to This Policy',
      content: `We may update our Privacy Policy periodically. Any changes will be posted on this page with an updated "Last Updated" date. We recommend reviewing this policy regularly to stay informed about how we protect your data.`
    },
    {
      title: 'Contact Us',
      content: `If you have questions or concerns about this Privacy Policy or our data practices, please contact us:

Email: AdminAattumTpl@gmail.com
Phone: +91 93848 20659
Address: No. 20/14, Kalaivanar Street, Sapthagiri Colony, Jafferkhanpet, Chennai- 600 083`
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-red-600 px-8 py-10 text-white">
          <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-red-100">Last Updated: May 2026</p>
        </div>
        
        <div className="px-8 py-8">
          <p className="text-gray-600 mb-10 leading-relaxed">
            Aattum TPL ("we", "our", or "us") is committed to protecting your privacy. 
            This Privacy Policy explains how we collect, use, and share information about you 
            when you use our mobile application and related services.
          </p>

          <div className="space-y-12">
            {sections.map((section, index) => (
              <div key={index} className="border-l-4 border-red-500 pl-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{index + 1}. {section.title}</h2>
                <div className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {section.content}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 pt-8 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Aattum TPL. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
