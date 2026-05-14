// Document Ready Client Logic
document.addEventListener('DOMContentLoaded', () => {
  
  // Set dynamic year in footer
  const currentYearEl = document.getElementById('current-year');
  if (currentYearEl) {
    currentYearEl.textContent = new Date().getFullYear();
  }

  // Language Initialization & Toggle Logic
  window.currentLang = localStorage.getItem('noustelos-lang') || 'en';
  setLanguage(window.currentLang);

  const langToggleBtn = document.getElementById('lang-toggle-btn');
  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', () => {
      window.currentLang = window.currentLang === 'en' ? 'el' : 'en';
      setLanguage(window.currentLang);
    });
  }

  // Mobile Menu Toggle Logic
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      const isHidden = mobileMenu.classList.contains('hidden');
      if (isHidden) {
        mobileMenu.classList.remove('hidden');
        // Simple animation or transform classes can be extended here
      } else {
        mobileMenu.classList.add('hidden');
      }
    });

    // Close menu when clicking links inside mobile menu
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    });
  }

  // Contact Form Handling
  const contactForm = document.getElementById('noustelos-contact-form');
  const submitBtn = document.getElementById('form-submit-btn');
  const submitText = document.getElementById('submit-text');
  const submitSpinner = document.getElementById('submit-spinner');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Gather Form Data
      const formData = new FormData(contactForm);
      const payload = {
        name: formData.get('name')?.trim(),
        email: formData.get('email')?.trim(),
        phone: formData.get('phone')?.trim(),
        service: formData.get('service'),
        message: formData.get('message')?.trim()
      };

      // Set Loading State
      const isGreek = window.currentLang === 'el';
      if (submitBtn) submitBtn.disabled = true;
      if (submitText) submitText.textContent = isGreek ? 'Αποστολή...' : 'Sending...';
      if (submitSpinner) submitSpinner.classList.remove('hidden');

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Trigger custom Success Toast alert
          showToast(isGreek ? 'Επιτυχία!' : 'Success!', result.message || (isGreek ? 'Το μήνυμα εστάλη επιτυχώς.' : 'Email sent successfully via Resend API.'), 'success');
          contactForm.reset();
        } else {
          // Trigger custom Error Toast alert
          showToast(isGreek ? 'Σφάλμα αποστολής' : 'Error sending message', result.error || (isGreek ? 'Αποτυχία αποστολής email.' : 'Failed to dispatch email.'), 'error');
        }

      } catch (err) {
        console.error('Submission processing error:', err);
        showToast(isGreek ? 'Σφάλμα Σύνδεσης' : 'Network Connection Error', isGreek ? 'Αδυναμία σύνδεσης στον server. Παρακαλώ δοκιμάστε ξανά.' : 'Could not reach server. Please try again later.', 'error');
      } finally {
        // Revert Loading State
        if (submitBtn) submitBtn.disabled = false;
        if (submitText) submitText.textContent = isGreek ? 'Αποστολη Μηνυματος' : 'Send Message via Resend API';
        if (submitSpinner) submitSpinner.classList.add('hidden');
      }
    });
  }

});

// Helper function to preselect service dropdown option from cards
function preselectService(serviceName) {
  const serviceDropdown = document.getElementById('contact-service');
  if (serviceDropdown) {
    for (let i = 0; i < serviceDropdown.options.length; i++) {
      if (serviceDropdown.options[i].value === serviceName) {
        serviceDropdown.selectedIndex = i;
        break;
      }
    }
  }
}

// Global Toast Alert Dispatcher
function showToast(title, message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toastId = 'toast-' + Date.now();
  const toastEl = document.createElement('div');
  toastEl.id = toastId;
  
  // Base toast classes
  toastEl.className = `toast p-4 rounded-xl shadow-xl border flex items-start gap-3 backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 ${
    type === 'success' 
      ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900' 
      : 'bg-rose-50/95 border-rose-200 text-rose-900'
  }`;

  // Icon HTML depending on type
  const iconHtml = type === 'success'
    ? `<div class="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 text-xs font-bold">&#10003;</div>`
    : `<div class="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 text-xs font-bold">!</div>`;

  toastEl.innerHTML = `
    ${iconHtml}
    <div class="flex-1">
      <strong class="block font-bold text-sm leading-tight mb-0.5">${title}</strong>
      <span class="block text-xs opacity-90">${message}</span>
    </div>
    <button onclick="document.getElementById('${toastId}').remove()" class="text-slate-400 hover:text-slate-600 text-xs font-bold p-1">&times;</button>
  `;

  container.appendChild(toastEl);

  // Auto remove toast after 6.5 seconds
  setTimeout(() => {
    const el = document.getElementById(toastId);
    if (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      setTimeout(() => el.remove(), 300);
    }
  }, 6500);
}

// Global Localization Dictionary
const translations = {
  en: {
    "brand-loc": "Santorini",
    "brand-sub": "Headquarters",
    "nav-services": "Services",
    "nav-about": "About Us",
    "nav-standards": "Partnership",
    "nav-testimonials": "Testimonials",
    "nav-cta": "Contact Us",
    "hero-badge": "Official Fluidra Partner",
    "hero-h1-1": "Leading Water Technology",
    "hero-h1-2": "in Santorini.",
    "hero-p": "Construction, Maintenance, and Specialized Chemicals for Pools & Spas. <strong class=\"font-bold text-primary-500\">Water Cycle Systems</strong> is the official partner of Fluidra S.A. (AstralPool) in the heart of the Cyclades.",
    "hero-btn-1": "Contact Us",
    "hero-btn-2": "Explore Services",
    "badge-1": "24/7 Support",
    "badge-2": "Fluidra Partner",
    "badge-3": "Expert Tech",
    "overlay-1": "AstralPool Certified",
    "overlay-2": "Premium Equipment",
    "srv-subtitle": "Our Services",
    "srv-title": "Expert Solutions for Every Pool Need",
    "srv-desc": "From initial design to year-round maintenance, we provide comprehensive care for your aquatic facilities.",
    "srv-card1-title": "Design & Construction",
    "srv-card1-desc": "Pools, Jacuzzis, Hamams, and Saunas featuring Italian design (Laghetto) and modern technology.",
    "srv-card2-title": "365-Day Maintenance",
    "srv-card2-desc": "Complete care for private villas and hotel units, ensuring flawless operation every day of the year.",
    "srv-card3-title": "Chemicals & Analysis",
    "srv-card3-desc": "Industry leader in chemicals (CTX) for crystal clear and safe water with sustainable solutions.",
    "srv-card4-title": "Automated Cleaning",
    "srv-card4-desc": "Top-tier Zodiac & Polaris robots for easy and efficient maintenance of your pool.",
    "srv-inquire": "Inquire Service &rarr;",
    "abt-subtitle": "Local Expertise",
    "abt-title": "By Your Side 24/7, Guaranteed by a Global Leader.",
    "abt-p1": "In Santorini, a pool or jacuzzi is not a luxury; it's your promise to the guest.",
    "abt-p2": "<strong class=\"font-bold text-primary-500\">Water Cycle Systems</strong> specializes in the construction and integrated maintenance of swimming pools, hamams, and saunas, offering immediate response and affordable prices. With 24-hour availability and deep knowledge of chemical analysis, we ensure your facility operates flawlessly, winter or summer.",
    "part-subtitle": "The Power of Partnership",
    "part-title": "Global Excellence, Local Support.",
    "part-copy": "We partner with Fluidra S.A., the global leader with over 50 years of experience in the Pool & Wellness industry.",
    "part-feat1": "Presence in 45 countries with the leading brand AstralPool.",
    "part-feat2": "Equipment trusted by professionals in World Championships and Olympic facilities.",
    "part-feat3": "Quality tested in over 2,000,000 pools worldwide.",
    "cnt-subtitle": "Get in Touch",
    "cnt-title": "We are at your disposal for any questions.",
    "cnt-desc": "Don't leave your pool maintenance to chance. Contact us today.",
    "cnt-btn-phone": "Call +30 6942072531",
    "cnt-btn-email": "Email Us",
    "cnt-btn-catalog": "Download Fluidra 2026 Catalog",
    "cnt-lbl-name": "Full Name *",
    "cnt-lbl-email": "Email Address *",
    "cnt-lbl-phone": "Phone Number",
    "cnt-lbl-service": "Service of Interest",
    "opt-1": "Design & Construction",
    "opt-2": "Maintenance 365",
    "opt-3": "Chemicals & Analysis",
    "opt-4": "Automated Cleaning",
    "opt-5": "General Inquiry",
    "cnt-lbl-message": "Message *",
    "cnt-submit": "Send Message",
    "ft-copyright": "<strong class=\"font-bold text-primary-500\">Water Cycle Systems</strong>. All rights reserved.",
    "ft-privacy": "Privacy Policy",
    "ft-terms": "Terms of Service"
  },
  el: {
    "brand-loc": "Σαντορινη",
    "brand-sub": "Κεντρικά Γραφεία",
    "nav-services": "Υπηρεσίες",
    "nav-about": "Η Εταιρεία",
    "nav-standards": "Συνεργασία",
    "nav-testimonials": "Κριτικές",
    "nav-cta": "Επικοινωνια",
    "hero-badge": "Επίσημος Συνεργάτης Fluidra",
    "hero-h1-1": "Κορυφαία Τεχνολογία",
    "hero-h1-2": "Νερού στη Σαντορίνη.",
    "hero-p": "Κατασκευή, Συντήρηση και Εξειδικευμένα Χημικά για Πισίνες & Spa. Η <strong class=\"font-bold text-primary-500\">Water Cycle Systems</strong> ειναι ο επίσημος συνεργάτης της Fluidra S.A. (AstralPool) στην καρδιά των Κυκλάδων.",
    "hero-btn-1": "Επικοινωνηστε",
    "hero-btn-2": "Υπηρεσιες",
    "badge-1": "24/7 Υποστήριξη",
    "badge-2": "Συνεργάτης Fluidra",
    "badge-3": "Τεχνική Εξειδίκευση",
    "overlay-1": "Πιστοποίηση AstralPool",
    "overlay-2": "Κορυφαίος Εξοπλισμός",
    "srv-subtitle": "Οι Υπηρεσίες μας",
    "srv-title": "Εξειδικευμένες Λύσεις για Κάθε Πισίνα",
    "srv-desc": "Από τον σχεδιασμό μέχρι τη συντήρηση, προσφέρουμε ολοκληρωμένη φροντίδα για τις εγκαταστάσεις σας.",
    "srv-card1-title": "Σχεδιασμός & Κατασκευή",
    "srv-card1-desc": "Πισίνες, Τζακούζι, Χαμάμ και Σάουνα με ιταλικό design (Laghetto) και σύγχρονη τεχνολογία.",
    "srv-card2-title": "Συντήρηση 365 Ημέρες",
    "srv-card2-desc": "Ολοκληρωμένη φροντίδα για ιδιωτικές βίλες και ξενοδοχειακές μονάδες, 365 ημέρες τον χρόνο.",
    "srv-card3-title": "Χημικά & Ανάλυση",
    "srv-card3-desc": "Ηγέτης στα χημικά (CTX) για κρυστάλλινο και ασφαλές νερό με βιώσιμες λύσεις.",
    "srv-card4-title": "Αυτοματοποιημένος Καθαρισμός",
    "srv-card4-desc": "Κορυφαία ρομπότ Zodiac & Polaris για εύκολη και αποδοτική συντήρηση της πισίνας σας.",
    "srv-inquire": "Εκδήλωση Ενδιαφέροντος &rarr;",
    "abt-subtitle": "Τοπική Εξειδίκευση",
    "abt-title": "Δίπλα σας 24/7, με την εγγύηση ενός Παγκόσμιου Ηγέτη.",
    "abt-p1": "Στη Σαντορίνη, η πισίνα και το τζακούζι δεν είναι πολυτέλεια, είναι η υπόσχεσή σας προς τον επισκέπτη.",
    "abt-p2": "Η <strong class=\"font-bold text-primary-500\">Water Cycle Systems</strong> εξειδικεύεται στην κατασκευή και ολοκληρωμένη συντήρηση κολυμβητικών δεξαμενών, χαμάμ και σάουνας, προσφέροντας άμεση ανταπόκριση και προσιτές τιμές. Με 24ωρη διαθεσιμότητα και βαθιά γνώση της ανάλυσης χημικών, διασφαλίζουμε ότι η εγκατάστασή σας θα λειτουργεί άψοβα, χειμώνα-καλοκαίρι.",
    "part-subtitle": "Η Ισχύς της Συνεργασίας",
    "part-title": "Παγκόσμια Υπεροχή, Τοπική Υποστήριξη.",
    "part-copy": "Συνεργαζόμαστε με τη Fluidra S.A., τον παγκόσμιο ηγέτη με περισσότερα από 50 χρόνια εμπειρίας στον κλάδο του Pool & Wellness.",
    "part-feat1": "Παρουσία σε 45 χώρες με την κορυφαία μάρκα AstralPool.",
    "part-feat2": "Εξοπλισμός που εμπιστεύονται επαγγελματίες σε Παγκόσμια Πρωταθλήματα και Ολυμπιακές εγκαστάσεις.",
    "part-feat3": "Ποιότητα που δοκιμάστηκε σε πάνω από 2.000.000 πισίνες παγκοσμίως.",
    "cnt-subtitle": "Επικοινωνία",
    "cnt-title": "Είμαστε στη διάθεσή σας για κάθε απορία.",
    "cnt-desc": "Μην αφήνετε τη συντήρηση της πισίνας σας στην τύχη. Επικοινωνήστε μαζί μας σήμερα.",
    "cnt-btn-phone": "Καλέστε +30 6942072531",
    "cnt-btn-email": "Στείλτε Email",
    "cnt-btn-catalog": "Κατεβάστε τον Κατάλογο Fluidra 2026",
    "cnt-lbl-name": "Ονοματεπώνυμο *",
    "cnt-lbl-email": "Διεύθυνση Email *",
    "cnt-lbl-phone": "Τηλέφωνο Επικοινωνίας",
    "cnt-lbl-service": "Υπηρεσία Ενδιαφέροντος",
    "opt-1": "Σχεδιασμός & Κατασκευή",
    "opt-2": "Συντήρηση 365",
    "opt-3": "Χημικά & Ανάλυση",
    "opt-4": "Αυτοματοποιημένος Καθαρισμός",
    "opt-5": "Γενική Ερώτηση",
    "cnt-lbl-message": "Μήνυμα *",
    "cnt-submit": "Αποστολη Μηνυματος",
    "ft-copyright": "<strong class=\"font-bold text-primary-500\">Water Cycle Systems</strong>. Με την επιφύλαξη παντός δικαιώματος.",
    "ft-privacy": "Πολιτική Απορρήτου",
    "ft-terms": "Όροι Υπηρεσιών"
  }
};

// Function to update language UI across the DOM
function setLanguage(lang) {
  window.currentLang = lang;
  localStorage.setItem('noustelos-lang', lang);
  
  // Update toggle button visuals
  const langEnEl = document.getElementById('lang-en');
  const langElEl = document.getElementById('lang-el');
  if (langEnEl && langElEl) {
    if (lang === 'en') {
      langEnEl.className = 'text-cyan-600 font-black';
      langElEl.className = 'opacity-50 hover:opacity-100 transition-opacity';
    } else {
      langElEl.className = 'text-cyan-600 font-black';
      langEnEl.className = 'opacity-50 hover:opacity-100 transition-opacity';
    }
  }

  // Update HTML lang attribute
  document.documentElement.lang = lang;

  // Update dynamic submit button text if form is present
  const submitText = document.getElementById('submit-text');
  if (submitText) {
    submitText.textContent = lang === 'el' ? 'Αποστολη Μηνυματος' : 'Send Message via Resend API';
  }

  // Translate all tagged elements
  const elements = document.querySelectorAll('[data-translate]');
  elements.forEach(el => {
    const key = el.getAttribute('data-translate');
    if (translations[lang] && translations[lang][key]) {
      el.innerHTML = translations[lang][key];
    }
  });
}
