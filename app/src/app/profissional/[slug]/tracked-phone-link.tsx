"use client";

import { trackEvent } from "@/lib/track";

// A tel: link that records a phone contact. Used for the phone shown in the
// profile "Details" section (outside the contact sidebar), so calls from there
// aren't lost from the contact data.
export default function TrackedPhoneLink({
  phone,
  professionalId,
  className,
}: {
  phone: string;
  professionalId: string;
  className?: string;
}) {
  return (
    <a
      href={`tel:${phone}`}
      className={className}
      onClick={() =>
        trackEvent({
          type: "contact",
          professional_id: professionalId,
          channel: "phone",
          source: "profile",
        })
      }
    >
      {phone}
    </a>
  );
}
