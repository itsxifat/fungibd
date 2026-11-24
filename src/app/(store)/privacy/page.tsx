import Link from "next/link";
import { policyLink, PolicyPage, PolicySection } from "@/components/store/PolicyPage";
import { storefrontMetadata } from "@/lib/seo";

export const metadata = storefrontMetadata("/privacy", "Privacy Policy · গোপনীয়তা নীতি", "How FungiBd handles Google sign-in data, customer accounts, delivery information, and privacy requests.");

export default function PrivacyPage() {
  return (
    <PolicyPage title="Privacy Policy" banglaTitle="গোপনীয়তা নীতি">
      <PolicySection title="Google sign-in" bangla="Google দিয়ে সাইন ইন করলে আপনার Google অ্যাকাউন্টের আইডি, ইমেইল ও ইমেইল যাচাইয়ের তথ্য পাই। নতুন গ্রাহকের প্রোফাইল তৈরিতে Google থেকে পাওয়া নাম ব্যবহার করি। পরেরবার সাইন ইন করার জন্য FungiBd অ্যাকাউন্টে Google আইডি সংরক্ষণ করি। Google-এর টোকেন শুধু সাইন ইন যাচাইয়ের সময় ব্যবহার করি।">
        <p>When you choose Continue with Google, we receive your Google account identifier, email address, and email verification status. For new customer accounts, we use your Google profile name and email to create your FungiBd profile. For an existing customer or admin account, we use the email to match the account you’re connecting.</p>
        <p>We store the Google account identifier with your FungiBd account so you can sign in again. Google tokens are used during the sign-in request and discarded afterward. FungiBd uses Google account information for account creation, linking, and sign-in. Signing in with Google leaves promotional email signup optional.</p>
      </PolicySection>
      <PolicySection title="Orders, delivery and support" bangla="অর্ডার নেওয়া, পণ্য পৌঁছে দেওয়া ও সহায়তা দেওয়ার জন্য আপনার দেওয়া নাম, ফোন, ইমেইল, ঠিকানা, লোকেশন পিন ও বার্তা ব্যবহার করি। সাইন ইন চালু রাখতে কুকি এবং কার্ট মনে রাখতে ব্রাউজারের লোকাল স্টোরেজ ব্যবহার করি।">
        <p>We collect details you provide at registration or checkout, including your name, contact details, delivery address, map pin, and order details. We use them to manage your account, fulfill orders, send updates, and respond to support and wholesale inquiries. If you submit a product review and we publish it, your name and review may appear on the storefront.</p>
        <p>We use HTTPS to protect information in transit and account permissions to control access to stored information. Cookies keep you signed in and help protect the sign-in process. Browser storage remembers your cart.</p>
      </PolicySection>
      <PolicySection title="Who receives your information" bangla="অর্ডার পৌঁছে দিতে প্রয়োজনীয় তথ্য ডেলিভারি কর্মীদের দিই। ওয়েবসাইট চালানো, ইমেইল পাঠানো ও মানচিত্রে ঠিকানা খোঁজার জন্য সংশ্লিষ্ট সেবা প্রয়োজনীয় তথ্য প্রক্রিয়া করে।">
        <p>Our staff use the information needed to run the store and help customers. Delivery personnel receive the contact and address information needed for your order. Hosting and email providers process information to operate the site and send messages. Map providers (Google Maps, or OpenStreetMap when Google Maps is unavailable) process map requests and the address searches or coordinates you submit through the map.</p>
        <p>The Google account identifier stays in the FungiBd account database. If you use your profile email for an order or request account emails, our email provider processes the recipient address to deliver the message.</p>
      </PolicySection>
      <PolicySection title="Retention and your choices" bangla="প্রোফাইল থেকে তথ্য পরিবর্তন করতে পারেন। FungiBd অ্যাকাউন্ট বা Google সংযোগের তথ্য মুছতে সাপোর্টে অনুরোধ করুন। হিসাব, নিরাপত্তা ও বিরোধ নিষ্পত্তির জন্য কিছু অর্ডার রেকর্ড ও ব্যাকআপ রাখা হতে পারে। প্রচারমূলক ইমেইল বন্ধ করতে প্রোফাইল বা ইমেইলের আনসাবস্ক্রাইব লিংক ব্যবহার করুন।">
        <p>We keep account and Google sign-in information while it is needed to provide your account. Order records, support messages, and backups may be retained for recordkeeping, security, or resolving disputes.</p>
        <p>Visit <Link href="/account" className={policyLink}>My account</Link> to update your profile or change marketing preferences. You can also unsubscribe using the link in a promotional email. To stop using Google sign-in, manage the connection in your <a href="https://myaccount.google.com/connections" className={policyLink}>Google Account</a>. To request access to, correction of, or deletion of the information FungiBd holds, including your Google sign-in identifier, <Link href="/support" className={policyLink}>contact FungiBd Support</Link>.</p>
      </PolicySection>
    </PolicyPage>
  );
}
