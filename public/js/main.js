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
          showToast(isGreek ? 'Επιτυχία!' : 'Success!', result.message || (isGreek ? 'Ευχαριστούμε. Το μήνυμά σας στάλθηκε με επιτυχία.' : 'Thank you. Your message has been sent successfully.'), 'success');
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
        if (submitText) submitText.textContent = isGreek ? 'Αποστολή Μηνύματος' : 'Send Message';
        if (submitSpinner) submitSpinner.classList.add('hidden');
      }
    });
  }

  // Floating Chat Widget Logic
  const chatBtn = document.getElementById('chat-widget-btn');
  const closeChatBtn = document.getElementById('close-chat-btn');
  const minimizeChatBtn = document.getElementById('minimize-chat-btn');
  const chatContainer = document.getElementById('chat-widget-container');

  if (chatBtn && chatContainer) {
    chatBtn.addEventListener('click', () => {
      chatContainer.classList.toggle('show-chat');
      // Hide button when chat is open on mobile
      if (window.innerWidth < 640 && chatContainer.classList.contains('show-chat')) {
        chatBtn.style.display = 'none';
      }
    });
  }

  const hideChat = () => {
    chatContainer.classList.remove('show-chat');
    if (chatBtn) chatBtn.style.display = 'flex';
  };

  if (closeChatBtn && chatContainer) closeChatBtn.addEventListener('click', hideChat);
  if (minimizeChatBtn && chatContainer) minimizeChatBtn.addEventListener('click', hideChat);

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
    "hero-h1-1": "Pool & Spa Care",
    "hero-h1-2": "for Santorini Villas & Hotels",
    "hero-p": "Construction, maintenance, water analysis and professional chemicals for pools, jacuzzis, hamams and saunas. Local support in Santorini, with fast response and trusted equipment from Fluidra / AstralPool.",
    "hero-btn-1": "Contact Us",
    "hero-btn-2": "Explore Services",
    "badge-1": "24/7 Support",
    "badge-2": "Fluidra Partner",
    "badge-3": "Expert Tech",
    "overlay-1": "AstralPool Certified",
    "overlay-2": "Premium Equipment",
    "srv-subtitle": "Local Services",
    "srv-title": "Everything Your Pool Needs Before Guests Notice a Problem",
    "srv-desc": "Professional care for villas and resorts. We handle the technical work so your facilities are always clean, safe, and ready.",
    "srv-card1-title": "Design & Construction",
    "srv-card1-desc": "Custom pools, jacuzzis, hamams, and saunas tailored for boutique hotels and luxury private villas.",
    "srv-card2-title": "Seasonal & Year-Round Maintenance",
    "srv-card2-desc": "Reliable cleaning and system checks to ensure your water remains crystal clear throughout the heavy tourist season.",
    "srv-card3-title": "Water Analysis & Chemicals",
    "srv-card3-desc": "Precise chemical balancing using trusted CTX products to guarantee safe swimming conditions for every guest.",
    "srv-card4-title": "Equipment Support",
    "srv-card4-desc": "Fast local repairs and automated cleaning solutions with Zodiac & Polaris robots to minimize downtime.",
    "srv-inquire": "Inquire Service &rarr;",
    "abt-subtitle": "Local Support",
    "abt-title": "In Santorini, a pool is part of the guest experience.",
    "abt-p1": "A cloudy pool, a cold jacuzzi or a chemical imbalance can turn into a complaint fast. Water Cycle Systems provides local, professional pool and spa support for properties that cannot afford downtime during the season.",
    "abt-p2": "We combine technical knowledge, water analysis and fast response, helping villas and hotels keep their facilities clean, safe and ready every day.",
    "abt-feat1-title": "Local Technicians",
    "abt-feat1-desc": "Based in Santorini for fast response when your property needs it most.",
    "abt-feat2-title": "Clear Reporting",
    "abt-feat2-desc": "Detailed chemical logs so property managers always know the state of their pools.",
    "part-subtitle": "Official Partner",
    "part-title": "Trusted Equipment for Professional Properties.",
    "part-copy": "As an official partner of Fluidra S.A. and AstralPool, we supply and install professional-grade pool and spa equipment built for heavy seasonal use.",
    "part-feat1": "Official access to AstralPool's full range of professional equipment.",
    "part-feat2": "Direct technical support and fast access to original spare parts.",
    "part-feat3": "Equipment built for the heavy demands of commercial pools and spas.",
    "cnt-subtitle": "Get in Touch",
    "cnt-title": "We are at your disposal for any questions.",
    "cnt-desc": "Don't leave your pool maintenance to chance. Contact us today.",
    "cnt-btn-phone": "Call +30 6942072531",
    "cnt-btn-email": "Email Us",
    "cnt-lbl-name": "Full Name *",
    "cnt-lbl-email": "Email Address *",
    "cnt-lbl-phone": "Phone Number",
    "cnt-lbl-service": "Service of Interest",
    "opt-1": "Design & Construction",
    "opt-2": "Seasonal & Year-Round Maintenance",
    "opt-3": "Water Analysis & Chemicals",
    "opt-4": "Equipment Support",
    "opt-5": "General Inquiry",
    "cnt-lbl-message": "Message *",
    "cnt-submit": "Send Message",
    "ft-copyright": "<strong class=\"font-bold text-primary-500\">Water Cycle Systems</strong>. All rights reserved.",
    "ft-privacy": "Privacy Policy",
    "ft-terms": "Terms of Service",
    "tst-subtitle": "Client Experiences",
    "tst-title": "Trusted by Outstanding Properties",
    "tst-r1-desc": "\"<strong class=\"font-bold text-primary-500\">Water Cycle Systems</strong> transformed our seasonal operation. Our luxury rental guests constantly compliment the absolute clarity of the pool water. Highly trustworthy crew!\"",
    "tst-r1-name": "Dimitris K.",
    "tst-r1-sub": "Villa Owner, Santorini",
    "tst-r2-desc": "\"When our central circulation pump failed right before a wedding event, <strong class=\"font-bold text-primary-500\">Water Cycle Systems</strong> dispatched technicians within 2 hours. Exceptional emergency service.\"",
    "tst-r2-name": "Elena S.",
    "tst-r2-sub": "Boutique Resort Manager",
    "tst-r3-desc": "\"We have worked with several service providers over the years, but none match the absolute lab precision of <strong class=\"font-bold text-primary-500\">Water Cycle Systems</strong> chemical water balancing. 10/10.\"",
    "tst-r3-name": "Andreas M.",
    "tst-r3-sub": "Residential Complex Board",
    "chat-title": "AI Assistant"
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
    "hero-h1-1": "Φροντίδα Πισίνας & Spa",
    "hero-h1-2": "για Βίλες & Ξενοδοχεία στη Σαντορίνη",
    "hero-p": "Κατασκευή, συντήρηση, ανάλυση νερού και επαγγελματικά χημικά για πισίνες, jacuzzi, χαμάμ και σάουνες. Τοπική υποστήριξη στη Σαντορίνη, με άμεση ανταπόκριση και αξιόπιστο εξοπλισμό Fluidra / AstralPool.",
    "hero-btn-1": "Επικοινωνηστε",
    "hero-btn-2": "Υπηρεσιες",
    "badge-1": "24/7 Υποστήριξη",
    "badge-2": "Συνεργάτης Fluidra",
    "badge-3": "Τεχνική Εξειδίκευση",
    "overlay-1": "Πιστοποίηση AstralPool",
    "overlay-2": "Κορυφαίος Εξοπλισμός",
    "srv-subtitle": "Τοπικές Υπηρεσίες",
    "srv-title": "Όλα όσα χρειάζεται η πισίνα σας, πριν το προσέξει ο επισκέπτης",
    "srv-desc": "Επαγγελματική φροντίδα για βίλες και ξενοδοχεία. Αναλαμβάνουμε το τεχνικό κομμάτι για να είναι οι εγκαταστάσεις σας πάντα καθαρές και ασφαλείς.",
    "srv-card1-title": "Σχεδιασμός & Κατασκευή",
    "srv-card1-desc": "Προσαρμοσμένες πισίνες, jacuzzi, χαμάμ και σάουνες, ιδανικές για boutique ξενοδοχεία και πολυτελείς βίλες.",
    "srv-card2-title": "Εποχιακή & Ετήσια Συντήρηση",
    "srv-card2-desc": "Αξιόπιστος καθαρισμός και έλεγχος συστημάτων για κρυστάλλινο νερό καθ' όλη τη διάρκεια της τουριστικής σεζόν.",
    "srv-card3-title": "Ανάλυση Νερού & Χημικά",
    "srv-card3-desc": "Ακριβής χημική ισορροπία με αξιόπιστα προϊόντα CTX, για την απόλυτη ασφάλεια των επισκεπτών σας.",
    "srv-card4-title": "Υποστήριξη Εξοπλισμού",
    "srv-card4-desc": "Άμεσες τοπικές επισκευές και λύσεις αυτοματοποιημένου καθαρισμού με ρομπότ Zodiac & Polaris.",
    "srv-inquire": "Εκδήλωση Ενδιαφέροντος &rarr;",
    "abt-subtitle": "Τοπική Υποστήριξη",
    "abt-title": "Στη Σαντορίνη, η πισίνα είναι μέρος της εμπειρίας του επισκέπτη.",
    "abt-p1": "Θολό νερό, πρόβλημα στο jacuzzi ή λάθος χημική ισορροπία μπορούν πολύ γρήγορα να γίνουν παράπονο. Η Water Cycle Systems προσφέρει τοπική, επαγγελματική υποστήριξη για βίλες και ξενοδοχειακές μονάδες που δεν έχουν περιθώριο για προβλήματα μέσα στη σεζόν.",
    "abt-p2": "Συνδυάζουμε τεχνική γνώση, ανάλυση νερού και άμεση ανταπόκριση, ώστε οι εγκαταστάσεις σας να παραμένουν καθαρές, ασφαλείς και έτοιμες κάθε μέρα.",
    "abt-feat1-title": "Τοπικοί Τεχνικοί",
    "abt-feat1-desc": "Με έδρα τη Σαντορίνη για άμεση ανταπόκριση όταν η εγκατάστασή σας το χρειάζεται.",
    "abt-feat2-title": "Ξεκάθαρη Αναφορά",
    "abt-feat2-desc": "Αναλυτικά αρχεία χημικών ώστε οι διαχειριστές να γνωρίζουν πάντα την κατάσταση.",
    "part-subtitle": "Επίσημος Συνεργάτης",
    "part-title": "Αξιόπιστος Εξοπλισμός για Επαγγελματικές Εγκαταστάσεις.",
    "part-copy": "Ως επίσημος συνεργάτης της Fluidra S.A. και της AstralPool, παρέχουμε και εγκαθιστούμε επαγγελματικό εξοπλισμό πισίνας και spa, κατασκευασμένο για βαριά εποχιακή χρήση.",
    "part-feat1": "Επίσημη πρόσβαση στην πλήρη γκάμα επαγγελματικού εξοπλισμού της AstralPool.",
    "part-feat2": "Άμεση τεχνική υποστήριξη και γρήγορη πρόσβαση σε γνήσια ανταλλακτικά.",
    "part-feat3": "Εξοπλισμός σχεδιασμένος για τις υψηλές απαιτήσεις των εμπορικών κολυμβητηρίων και spa.",
    "cnt-subtitle": "Επικοινωνία",
    "cnt-title": "Είμαστε στη διάθεσή σας για κάθε απορία.",
    "cnt-desc": "Μην αφήνετε τη συντήρηση της πισίνας σας στην τύχη. Επικοινωνήστε μαζί μας σήμερα.",
    "cnt-btn-phone": "Καλέστε +30 6942072531",
    "cnt-btn-email": "Στείλτε Email",
    "cnt-lbl-name": "Ονοματεπώνυμο *",
    "cnt-lbl-email": "Διεύθυνση Email *",
    "cnt-lbl-phone": "Τηλέφωνο Επικοινωνίας",
    "cnt-lbl-service": "Υπηρεσία Ενδιαφέροντος",
    "opt-1": "Σχεδιασμός & Κατασκευή",
    "opt-2": "Εποχιακή & Ετήσια Συντήρηση",
    "opt-3": "Ανάλυση Νερού & Χημικά",
    "opt-4": "Υποστήριξη Εξοπλισμού",
    "opt-5": "Γενική Ερώτηση",
    "cnt-lbl-message": "Μήνυμα *",
    "cnt-submit": "Αποστολή Μηνύματος",
    "ft-copyright": "<strong class=\"font-bold text-primary-500\">Water Cycle Systems</strong>. Με την επιφύλαξη παντός δικαιώματος.",
    "ft-privacy": "Πολιτική Απορρήτου",
    "ft-terms": "Όροι Υπηρεσιών",
    "tst-subtitle": "Εμπειρίες Πελατών",
    "tst-title": "Μας εμπιστεύονται κορυφαία ακίνητα",
    "tst-r1-desc": "\"Η <strong class=\"font-bold text-primary-500\">Water Cycle Systems</strong> μεταμόρφωσε την εποχιακή μας λειτουργία. Οι επισκέπτες μας σχολιάζουν διαρκώς την απόλυτη καθαρότητα του νερού. Πολύ αξιόπιστη ομάδα!\"",
    "tst-r1-name": "Δημήτρης Κ.",
    "tst-r1-sub": "Ιδιοκτήτης Βίλας, Σαντορίνη",
    "tst-r2-desc": "\"Όταν η κεντρική αντλία μας χάλασε ακριβώς πριν από έναν γάμο, η <strong class=\"font-bold text-primary-500\">Water Cycle Systems</strong> έστειλε τεχνικούς μέσα σε 2 ώρες. Εξαιρετική υπηρεσία έκτακτης ανάγκης.\"",
    "tst-r2-name": "Έλενα Σ.",
    "tst-r2-sub": "Boutique Resort Manager",
    "tst-r3-desc": "\"Έχουμε συνεργαστεί με πολλούς, αλλά κανείς δεν φτάνει την εργαστηριακή ακρίβεια της <strong class=\"font-bold text-primary-500\">Water Cycle Systems</strong> στη χημική ισορροπία του νερού. 10/10.\"",
    "tst-r3-name": "Ανδρέας Μ.",
    "tst-r3-sub": "Διαχείριση Οικιστικού Συγκροτήματος",
    "chat-title": "Ψηφιακός Βοηθός"
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
    submitText.textContent = lang === 'el' ? 'Αποστολή Μηνύματος' : 'Send Message';
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
