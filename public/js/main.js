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
    "nav-standards": "Quality Standards",
    "nav-testimonials": "Testimonials",
    "nav-cta": "Get a Quote",
    "hero-badge": "Santorini Premium Pool Care",
    "hero-h1-1": "Crystal Clear Waters,",
    "hero-h1-2": "Effortless Perfection.",
    "hero-p": "Experience flawless pool care tailored to luxury villas, boutique hotels, and residential estates. Delivered by certified experts using advanced balancing chemistry.",
    "hero-btn-1": "Book Free Inspection",
    "hero-btn-2": "Explore Services",
    "badge-1": "Eco-friendly Labs",
    "badge-2": "Emergency Care",
    "badge-3": "Years Expertise",
    "overlay-1": "pH Perfectly Balanced",
    "overlay-2": "Tested automatically today",
    "srv-subtitle": "Professional Solutions",
    "srv-title": "Comprehensive Care for Ultimate Peace of Mind",
    "srv-desc": "We handle every aspect of swimming pool operations so you can focus purely on enjoyment.",
    "srv-card1-title": "Routine Maintenance",
    "srv-card1-desc": "Scheduled skimming, brushing, vacuuming, and filter cleansing to ensure clear aesthetics and prevent long-term component wear.",
    "srv-inquire": "Inquire Service &rarr;",
    "srv-card2-title": "Chemical Balancing",
    "srv-card2-desc": "Meticulous testing and lab-grade adjustment of pH, alkalinity, chlorine, and stabilizers to guarantee completely hygienic, skin-friendly water.",
    "srv-card3-title": "Equipment Repairs & Tech",
    "srv-card3-desc": "Rapid diagnosis and replacement of worn pumps, automated multi-valves, LED sub-surface lighting, and high-efficiency smart heaters.",
    "srv-card3-sub": "Smart Automated Systems Integration",
    "abt-subtitle": "About Water Cycle Systems",
    "abt-title": "Setting the Premium Standard for Aquatic Care",
    "abt-p1": "Founded on the principles of impeccable reliability and strict technical excellence, Water Cycle Systems has grown to become the trusted partner for premier estates across Greece.",
    "abt-p2": "We believe a pool is not just an asset, but the central jewel of an outdoor living space. Our trained crews treat every client property with utmost discretion, leaving behind nothing but gleaming surfaces and perfectly sterile water.",
    "abt-feat1-title": "Certified Technicians",
    "abt-feat1-desc": "Rigorous continuous training in hydraulic systems and water safety.",
    "abt-feat2-title": "Transparent Pricing",
    "abt-feat2-desc": "Detailed chemical logs and fully documented seasonal audits.",
    "std-subtitle": "The Water Cycle Systems Guarantee",
    "std-title": "Why Premier Villa Owners Choose Us",
    "std-card1-title": "Punctual Schedules",
    "std-card1-desc": "We arrive strictly on agreed timetables, ensuring zero disruption to guests.",
    "std-card2-title": "Premium Chemicals",
    "std-card2-desc": "Only superior European lab-grade ingredients protecting sensitive eyes and skin.",
    "std-card3-title": "Energy Optimization",
    "std-card3-desc": "Pump tuning strategies to decrease multi-season electrical operation utility bills.",
    "std-card4-title": "Direct Support",
    "std-card4-desc": "Direct instant messaging access to assigned localized head maintenance supervisors.",
    "tst-subtitle": "Client Experiences",
    "tst-title": "Trusted by Outstanding Properties",
    "tst-r1-desc": "\"Water Cycle Systems transformed our seasonal operation. Our luxury rental guests constantly compliment the absolute clarity of the pool water. Highly trustworthy crew!\"",
    "tst-r1-name": "Dimitris K.",
    "tst-r1-sub": "Villa Owner, Mykonos",
    "tst-r2-desc": "\"When our central circulation pump failed right before a wedding event, Water Cycle Systems dispatched technicians within 2 hours. Exceptional emergency service.\"",
    "tst-r2-name": "Elena S.",
    "tst-r2-sub": "Boutique Resort Manager",
    "tst-r3-desc": "\"We have worked with several service providers over the years, but none match the absolute lab precision of Water Cycle Systems chemical water balancing. 10/10.\"",
    "tst-r3-name": "Andreas M.",
    "tst-r3-sub": "Residential Complex Board",
    "cnt-subtitle": "Connect With Experts",
    "cnt-title": "Request Free Quote & Consultation",
    "cnt-desc": "Fill out the details below. Our technical supervisor will reach out with a personalized plan. Emails are routed directly to <strong class=\"text-white\">info@noustelos.gr</strong>.",
    "cnt-lbl-name": "Full Name *",
    "cnt-lbl-email": "Email Address *",
    "cnt-lbl-phone": "Phone Number",
    "cnt-lbl-service": "Service of Interest",
    "opt-1": "Routine Maintenance",
    "opt-2": "Chemical Balancing",
    "opt-3": "Equipment Repairs",
    "opt-4": "Seasonal Deep Cleaning",
    "opt-5": "General Inquiry",
    "cnt-lbl-message": "Property Details & Message *",
    "cnt-submit": "Send Message via Resend API",
    "ft-copyright": "Water Cycle Systems. Secure Contact System integrated with Resend API. Built optimized for maximum speed.",
    "ft-privacy": "Privacy Policy",
    "ft-terms": "Terms of Care"
  },
  el: {
    "brand-loc": "Σαντορινη",
    "brand-sub": "Κεντρικά Γραφεία",
    "nav-services": "Υπηρεσίες",
    "nav-about": "Η Εταιρεία",
    "nav-standards": "Πρότυπα Ποιότητας",
    "nav-testimonials": "Κριτικές",
    "nav-cta": "Ζητηστε Προσφορα",
    "hero-badge": "Premium Φροντίδα Πισίνας στη Σαντορίνη",
    "hero-h1-1": "Κρυστάλλινα Νερά,",
    "hero-h1-2": "Απόλυτη Τελειότητα.",
    "hero-p": "Εμπειρία κορυφαίας φροντίδας πισίνας, ειδικά σχεδιασμένη για πολυτελείς βίλες, boutique ξενοδοχεία και ιδιωτικές κατοικίες. Παρέχεται από πιστοποιημένους ειδικούς με προηγμένη χημική ισορροπία.",
    "hero-btn-1": "Δωρεαν Ελεγχος",
    "hero-btn-2": "Υπηρεσιες",
    "badge-1": "Οικολογικά Προϊόντα",
    "badge-2": "Έκτακτη Υποστήριξη",
    "badge-3": "Χρόνια Εμπειρίας",
    "overlay-1": "Τέλεια Ισορροπία pH",
    "overlay-2": "Αυτόματος σημερινός έλεγχος",
    "srv-subtitle": "Επαγγελματικες Λυσεις",
    "srv-title": "Ολοκληρωμένη Φροντίδα για Απόλυτη Ηρεμία",
    "srv-desc": "Αναλαμβάνουμε κάθε πτυχή της λειτουργίας της πισίνας σας, ώστε να εστιάσετε αποκλειστικά στην απόλαυση.",
    "srv-card1-title": "Τακτική Συντήρηση",
    "srv-card1-desc": "Προγραμματισμένος καθαρισμός επιφανειών, βούρτσισμα, σκούπισμα και καθαρισμός φίλτρων για κρυστάλλινη όψη και αποφυγή φθορών.",
    "srv-inquire": "Εκδήλωση Ενδιαφέροντος &rarr;",
    "srv-card2-title": "Χημική Ισορροπία",
    "srv-card2-desc": "Σχολαστικός έλεγχος και ρύθμιση εργαστηριακού επιπέδου σε pH, αλκαλικότητα και χλώριο για απόλυτα υγιεινό νερό, φιλικό προς το δέρμα.",
    "srv-card3-title": "Επισκευές & Εξοπλισμός",
    "srv-card3-desc": "Άμεση διάγνωση και αντικατάσταση αντλιών, αυτοματοποιημένων βαλβίδων, υποβρύχιου φωτισμού LED και αντλιών θερμότητας υψηλής απόδοσης.",
    "srv-card3-sub": "Ενσωμάτωση Έξυπνων Αυτοματισμών",
    "abt-subtitle": "Water Cycle Systems",
    "abt-title": "Θέτοντας το Premium Πρότυπο στη Φροντίδα Πισίνας",
    "abt-p1": "Βασισμένη στις αρχές της απόλυτης αξιοπιστίας και της αυστηρής τεχνικής αρτιότητας, η Water Cycle Systems αποτελεί τον κορυφαίο συνεργάτη για πολυτελείς ιδιοκτησίες σε όλη την Ελλάδα.",
    "abt-p2": "Πιστεύουμε ότι η πισίνα δεν είναι απλώς μια εγκατάσταση, αλλά το κεντρικό στολίδι του εξωτερικού σας χώρου. Τα εκπαιδευμένα συνεργεία μας αντιμετωπίζουν κάθε ιδιοκτησία με απόλυτη διακριτικότητα, αφήνοντας πίσω τους αστραφτερές επιφάνειες και απόλυτα καθαρό νερό.",
    "abt-feat1-title": "Πιστοποιημένοι Τεχνικοί",
    "abt-feat1-desc": "Συνεχής και αυστηρή εκπαίδευση σε υδραυλικά συστήματα και ασφάλεια υδάτων.",
    "abt-feat2-title": "Διαφανής Τιμολόγηση",
    "abt-feat2-desc": "Αναλυτικά αρχεία χημικών μετρήσεων και πλήρως τεκμηριωμένοι εποχικοί έλεγχοι.",
    "std-subtitle": "Η Εγγυηση της Water Cycle Systems",
    "std-title": "Γιατί μας Επιλέγουν οι Ιδιοκτήτες Premium Βιλών",
    "std-card1-title": "Απόλυτη Συνέπεια",
    "std-card1-desc": "Τηρούμε αυστηρά τα συμφωνηθέντα χρονοδιαγράμματα, διασφαλίζοντας μηδενική ενόχληση στους επισκέπτες.",
    "std-card2-title": "Κορυφαία Χημικά",
    "std-card2-desc": "Χρησιμοποιούμε αποκλειστικά ανώτερα Ευρωπαϊκά υλικά εργαστηριακού επιπέδου που προστατεύουν τα μάτια και το δέρμα.",
    "std-card3-title": "Ενεργειακή Βελτιστοποίηση",
    "std-card3-desc": "Στρατηγικές ρύθμισης αντλιών για τη μείωση του κόστους ρεύματος καθ' όλη τη διάρκεια της σεζόν.",
    "std-card4-title": "Άμεση Επικοινωνία",
    "std-card4-desc": "Απευθείας πρόσβαση μέσω μηνυμάτων στους τοπικούς υπεύθυνους επόπτες συντήρησης.",
    "tst-subtitle": "Εμπειριες Πελατων",
    "tst-title": "Μας Εμπιστεύονται τα Κορυφαία Καταλύματα",
    "tst-r1-desc": "\"Η Water Cycle Systems μεταμόρφωσε τη λειτουργία μας. Οι επισκέπτες μας κάνουν συνεχώς κοπλιμέντα για την απόλυτη καθαρότητα του νερού. Εξαιρετικά αξιόπιστη ομάδα!\"",
    "tst-r1-name": "Δημήτρης Κ.",
    "tst-r1-sub": "Ιδιοκτήτης Βίλας, Μύκονος",
    "tst-r2-desc": "\"Όταν η κεντρική αντλία ανακυκλοφορίας παρουσίασε βλάβη πριν από μια δεξίωση γάμου, η ομάδα έστειλε τεχνικούς μέσα σε 2 ώρες. Εξαιρετική άμεση εξυπηρέτηση.\"",
    "tst-r2-name": "Έλενα Σ.",
    "tst-r2-sub": "Manager Boutique Resort",
    "tst-r3-desc": "\"Έχουμε συνεργαστεί με αρκετές εταιρείες, αλλά καμία δεν φτάνει την απόλυτη ακρίβεια της Water Cycle Systems στη χημική ισορροπία του νερού. 10/10.\"",
    "tst-r3-name": "Ανδρέας Μ.",
    "tst-r3-sub": "Συμβούλιο Συγκροτήματος Κατοικιών",
    "cnt-subtitle": "Επικοινωνια με τους Ειδικους",
    "cnt-title": "Ζητήστε Δωρεάν Προσφορά & Συμβουλευτική",
    "cnt-desc": "Συμπληρώστε τα παρακάτω στοιχεία. Ο τεχνικός μας επόπτης θα επικοινωνήσει μαζί σας με ένα εξατομικευμένο πλάνο. Τα email δρομολογούνται απευθείας στο <strong class=\"text-white\">info@noustelos.gr</strong>.",
    "cnt-lbl-name": "Ονοματεπώνυμο *",
    "cnt-lbl-email": "Διεύθυνση Email *",
    "cnt-lbl-phone": "Τηλέφωνο Επικοινωνίας",
    "cnt-lbl-service": "Υπηρεσία Ενδιαφέροντος",
    "opt-1": "Τακτική Συντήρηση",
    "opt-2": "Χημική Ισορροπία",
    "opt-3": "Επισκευές & Εξοπλισμός",
    "opt-4": "Εποχικός Βαθύς Καθαρισμός",
    "opt-5": "Γενική Ερώτηση",
    "cnt-lbl-message": "Λεπτομέρειες Ιδιοκτησίας & Μήνυμα *",
    "cnt-submit": "Αποστολη Μηνυματος",
    "ft-copyright": "Water Cycle Systems. Ασφαλές σύστημα επικοινωνίας μέσω Resend API. Βελτιστοποιημένο για μέγιστη ταχύτητα.",
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
