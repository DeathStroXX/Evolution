export async function sendPitchEmail(eventTitle: string, clicks: number, sourceUrl: string) {
  // Simulate network delay for sending an email
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log(`
======================================================================
[MOCK EMAIL SENT]
TO: organizer@domain.com (Extracted from ${sourceUrl})
SUBJECT: Your event "${eventTitle}" is trending on Mainfranken Community Connect!
======================================================================
Hi there,

We noticed that your event "${eventTitle}" has been very popular on our website, receiving over ${clicks} clicks from interested community members!

Would you like to officially register your event on our platform? Doing so gives you access to our advanced dashboard where you can:
1. Track which users are referring your event.
2. Monitor engagement and reach.
3. Bring even more people to your event.

Note: By joining, you agree to our referral rewards program. For example, rewarding community members who bring 5-10 people with a small gift (like a hoodie or t-shirt).

We'd love to have you officially on board!

Best regards,
The Mainfranken Community Connect Team
======================================================================
`);
}
