import Link from "next/link";
import { policyLink, PolicyPage, PolicySection } from "@/components/store/PolicyPage";
import { storefrontMetadata } from "@/lib/seo";

export const metadata = storefrontMetadata("/terms", "Terms of Service · ব্যবহারের শর্তাবলি", "Terms for using FungiBd, signing in, placing orders, and arranging delivery.");

export default function TermsPage() {
  return (
    <PolicyPage title="Terms of Service" banglaTitle="ব্যবহারের শর্তাবলি">
      <PolicySection title="Using FungiBd" bangla="FungiBd-এ মাশরুম ও সংশ্লিষ্ট পণ্য দেখা, অর্ডার করা ও অর্ডারের অবস্থা জানা যায়। সঠিক যোগাযোগ ও ডেলিভারি তথ্য দিন। অ্যাকাউন্ট ব্যবহার করলে আপনার সাইন ইন তথ্য নিরাপদে রাখুন।">
        <p>FungiBd is an online store for mushrooms and related products. These terms apply when you browse, create an account, place an order, or request support. Provide accurate contact and delivery details and keep your account credentials secure.</p>
        <p>You can order as a guest or use a customer account. Sign in with Google is optional. The <Link href="/privacy" className={policyLink}>Privacy Policy</Link> explains how we handle sign-in and order information.</p>
      </PolicySection>
      <PolicySection title="Prices, orders and delivery" bangla="পণ্যের দাম ও প্রযোজ্য ডেলিভারি চার্জ চেকআউটে দেখানো হয়। ঢাকা সিটির মধ্যে ডেলিভারি দেওয়া হয় এবং পণ্য হাতে পেয়ে মূল্য পরিশোধ করতে হয়। স্টক ও হারভেস্টের ওপর অর্ডার নিশ্চিতকরণ ও ডেলিভারির সময় নির্ভর করে।">
        <p>Checkout shows the price of the products and the applicable delivery charge before you submit an order. FungiBd delivers to the areas shown at checkout and on the delivery areas page (Dhaka and nearby areas) and accepts cash on delivery. Orders are subject to stock and delivery availability. Pre-order dates depend on the harvest. If a confirmed delivery date changes, we’ll contact you using the details you provided.</p>
      </PolicySection>
      <PolicySection title="Changes, cancellations and order issues" bangla="অর্ডার পরিবর্তন বা বাতিল করতে ডেলিভারির জন্য পণ্য রওনা হওয়ার আগে যোগাযোগ করুন। পণ্যে কোনো সমস্যা হলে ডেলিভারির দিন অর্ডার নম্বরসহ সাপোর্টে জানান।">
        <p>Contact FungiBd before dispatch to request a change or cancellation. If there’s a problem with your order, contact support on the delivery day and include your order number. Read the <Link href="/policies" className={policyLink}>Delivery and Order Policies</Link> for details.</p>
      </PolicySection>
    </PolicyPage>
  );
}
