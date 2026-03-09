/**
 * contact.js
 * SCASFLIX - Footer Contact Form Handler
 * Depends on: auth.js (for validateContact + showToast)
 */

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const name    = document.getElementById('cName').value;
    const email   = document.getElementById('cEmail').value;
    const subject = document.getElementById('cSubject').value;
    const message = document.getElementById('cMessage').value;

    const result = validateContact(name, email, subject, message);

    if (!result.ok) {
      showToast(result.error, 'error');
      return;
    }

    form.reset();
    showToast("Message sent successfully! We'll get back to you soon.", 'success');
  });
});
