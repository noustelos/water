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
      
      // Update target language in aria-label
      langToggleBtn.setAttribute('aria-label', window.currentLang === 'en' ? 'Switch to Greek' : 'Switch to English');
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
        mobileMenuBtn.setAttribute('aria-expanded', 'true');
        mobileMenuBtn.setAttribute('aria-label', 'Close navigation menu');
      } else {
        mobileMenu.classList.add('hidden');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.setAttribute('aria-label', 'Open navigation menu');
      }
    });


    // Close menu when clicking links inside mobile menu
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.setAttribute('aria-label', 'Open navigation menu');
        mobileMenuBtn.focus(); // Return focus to the toggle button
      });
    });

  }

  // --- Header Scroll Logic: Toggle background/shadow on scroll ---
  const headerContainer = document.getElementById('main-nav-container');
  if (headerContainer) {
    const handleHeaderScroll = () => {
      if (window.scrollY > 20) {
        headerContainer.classList.add('header-scrolled');
      } else {
        headerContainer.classList.remove('header-scrolled');
      }
    };
    window.addEventListener('scroll', handleHeaderScroll, { passive: true });
    handleHeaderScroll(); // Initial check
  }

  // Contact Form Handling
  const contactForm  = document.getElementById('noustelos-contact-form');
  const submitBtn    = document.getElementById('form-submit-btn');
  const submitText   = document.getElementById('submit-text');
  const submitSpinner = document.getElementById('submit-spinner');
  const formStatus   = document.getElementById('form-status');


  // ── reCAPTCHA v3 helper ──────────────────────────────────────────────────
  // Reads site key from the button's data-sitekey.
  // Falls back to submitting without a token when key is still the placeholder
  // (so local dev is never blocked).
  async function getRecaptchaToken() {
    const siteKey = submitBtn?.getAttribute('data-sitekey') || '';
    const action  = submitBtn?.getAttribute('data-action')  || 'submit';

    if (!siteKey || siteKey === 'YOUR_SITE_KEY' || typeof grecaptcha === 'undefined') {
      return null;
    }

    return new Promise((resolve) => {
      grecaptcha.ready(() => {
        grecaptcha.execute(siteKey, { action }).then(resolve);
      });
    });
  }

  // ── Global callback referenced by data-callback="onRecaptchaSuccess" ─────
  // Called automatically by reCAPTCHA if the button is rendered as a widget;
  // also invoked manually below for the programmatic v3 flow.
  window.onRecaptchaSuccess = function(token) {
    // Expose latest token so the submit handler can pick it up
    window._recaptchaToken = token;
  };

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Gather Form Data
      const formData = new FormData(contactForm);
      const payload = {
        name:    formData.get('name')?.trim(),
        email:   formData.get('email')?.trim(),
        phone:   formData.get('phone')?.trim(),
        service: formData.get('service'),
        message: formData.get('message')?.trim()
      };

      function openEmailFallback() {
        const subject = `Water Cycle System inquiry: ${payload.service || 'General Inquiry'}`;
        const body = [
          `Name: ${payload.name || ''}`,
          `Email: ${payload.email || ''}`,
          `Phone: ${payload.phone || ''}`,
          `Service: ${payload.service || 'General Inquiry'}`,
          '',
          'Message:',
          payload.message || ''
        ].join('\n');

        window.location.href = `mailto:info@watercyclesystem.gr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      }

      // Set Loading State
      const isGreek = window.currentLang === 'el';
      if (submitBtn)    submitBtn.disabled = true;
      if (submitText)   submitText.textContent = isGreek ? 'Επαληθευση...' : 'Verifying...';
      if (submitSpinner) submitSpinner.classList.remove('hidden');
      if (formStatus)   formStatus.textContent = isGreek ? 'Επαλήθευση στοιχείων...' : 'Verifying details...';


      try {
        // ── Acquire reCAPTCHA v3 token ───────────────────────────────────
        const token = await getRecaptchaToken();
        if (token) {
          window.onRecaptchaSuccess(token);   // keep global in sync
          payload.recaptchaToken = token;     // send to backend for verification
        }

        // Update loading label now that verification is done
        if (submitText) submitText.textContent = isGreek ? 'Αποστολη...' : 'Sending...';
        if (formStatus) formStatus.textContent = isGreek ? 'Αποστολή μηνύματος...' : 'Sending message...';


        // ── Send to API ─────────────────────────────────────────────────
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const contentType = response.headers.get('content-type') || '';
        const result = contentType.includes('application/json') ? await response.json() : {};

        if (response.status === 404 || !contentType.includes('application/json')) {
          openEmailFallback();
          showToast(
            isGreek ? 'Άνοιγμα email' : 'Opening email',
            isGreek ? 'Άνοιξε το email app σας με προσυμπληρωμένο μήνυμα.' : 'Your email app opened with the message prefilled.',
            'success'
          );
          if (formStatus) formStatus.textContent = isGreek ? 'Άνοιξε το email app σας με προσυμπληρωμένο μήνυμα.' : 'Your email app opened with the message prefilled.';
          return;
        }

        if (response.ok && result.success) {
          const successMessage = isGreek
            ? 'Ευχαριστούμε. Το μήνυμά σας στάλθηκε με επιτυχία.'
            : (result.message || 'Thank you. Your message has been sent successfully.');

          showToast(
            isGreek ? 'Επιτυχία!' : 'Success!',
            successMessage,
            'success'
          );
          contactForm.reset();
          if (formStatus) formStatus.textContent = successMessage;
        } else {
          showToast(
            isGreek ? 'Σφάλμα αποστολής' : 'Error sending message',
            result.error || (isGreek ? 'Αποτυχία αποστολής email.' : 'Failed to dispatch email.'),
            'error'
          );
          if (formStatus) formStatus.textContent = isGreek ? 'Σφάλμα: ' + (result.error || 'Αποτυχία αποστολής.') : 'Error: ' + (result.error || 'Failed to dispatch.');
        }


      } catch (err) {
        openEmailFallback();
        showToast(
          isGreek ? 'Άνοιγμα email' : 'Opening email',
          isGreek ? 'Άνοιξε το email app σας με προσυμπληρωμένο μήνυμα.' : 'Your email app opened with the message prefilled.',
          'success'
        );
        if (formStatus) formStatus.textContent = isGreek ? 'Άνοιξε το email app σας με προσυμπληρωμένο μήνυμα.' : 'Your email app opened with the message prefilled.';

      } finally {
        // Revert Loading State
        if (submitBtn)    submitBtn.disabled = false;
        if (submitText)   submitText.textContent = isGreek ? 'Αποστολη Μηνυματος' : 'Send Message';
        if (submitSpinner) submitSpinner.classList.add('hidden');
      }
    });
  }

  // Floating Chat Widget Logic
  const chatBtn = document.getElementById('chat-widget-btn');
  const closeChatBtn = document.getElementById('close-chat-btn');
  const minimizeChatBtn = document.getElementById('minimize-chat-btn');
  const chatContainer = document.getElementById('chat-widget-container');
  const chatBody = document.getElementById('chat-widget-body');
  let chatLoaded = false;

  function loadChatWidget() {
    if (chatLoaded || !chatBody) return;
    chatLoaded = true;

    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://gradio.s3-us-west-2.amazonaws.com/6.14.0/gradio.js';
    document.body.appendChild(script);

    chatBody.innerHTML = '<gradio-app src="https://nik-greek-water.hf.space" theme_mode="light" eager="true" style="display: block; width: 100%;"></gradio-app>';
  }

  if (chatBtn && chatContainer) {
    chatBtn.addEventListener('click', () => {
      chatContainer.classList.toggle('show-chat');
      if (chatContainer.classList.contains('show-chat')) loadChatWidget();
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

  // --- ScrollSpy: inline-style approach for both desktop + mobile nav ---
  (function initScrollSpy() {
    // Grab desktop nav links AND mobile menu links
    const desktopLinks = Array.from(document.querySelectorAll('header nav a[href^="#"]'));
    const mobileLinks = Array.from(document.querySelectorAll('#mobile-menu a[href^="#"]'));
    const allLinks = [...desktopLinks, ...mobileLinks];

    if (allLinks.length === 0) return;

    // Unique section IDs referenced by desktop nav
    const sectionIds = desktopLinks.map(l => l.getAttribute('href').slice(1));

    function update() {
      const scrollY = window.scrollY || window.pageYOffset;
      const threshold = scrollY + 120; // Trigger highlight when section is 120px from top
      let activeId = null;

      // If scrolled to (or very near) the bottom of the page, always activate last section
      const nearBottom = (window.innerHeight + scrollY) >= (document.documentElement.scrollHeight - 100);

      if (nearBottom && sectionIds.length > 0) {
        activeId = sectionIds[sectionIds.length - 1];
      } else {
        sectionIds.forEach(id => {
          const section = document.getElementById(id);
          if (!section) return;
          const sectionTop = section.offsetTop;
          if (sectionTop <= threshold) activeId = id;
        });
      }

      allLinks.forEach(link => {
        const targetId = link.getAttribute('href').slice(1);
        const isActive = targetId === activeId;
        
        if (isActive) {
          link.classList.add('nav-link-active');
          link.setAttribute('aria-current', 'page');
        } else {
          link.classList.remove('nav-link-active');
          link.removeAttribute('aria-current');
        }
      });

    }

    window.addEventListener('scroll', update, { passive: true });
    setTimeout(update, 200);
  })();


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
    <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600 text-xs font-bold p-1" aria-label="Dismiss notification">&times;</button>

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
    "nav-contact": "Contact",
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
    "abt-p1": "A cloudy pool, a cold jacuzzi or a chemical imbalance can turn into a complaint fast. Water Cycle System provides local, professional pool and spa support for properties that cannot afford downtime during the season.",
    "abt-p2": "We combine technical knowledge, water analysis and fast response, helping villas and hotels keep their facilities clean, safe and ready every day.",
    "abt-feat1-title": "Local Technicians",
    "abt-feat1-desc": "Based in Santorini for fast response when your property needs it most.",
    "abt-feat2-title": "Detailed Logging",
    "abt-feat2-desc": "Detailed chemical logs so property managers always know the state of their pools.",
    "part-subtitle": "Official Partner",
    "part-title": "Trusted Equipment for Professional Properties.",
    "part-copy": "As an official partner of Fluidra S.A. and AstralPool, we supply and install professional-grade pool and spa equipment built for heavy seasonal use.",
    "part-feat1": "Official access to AstralPool's full range of professional equipment.",
    "part-feat2": "Direct technical support and fast access to original spare parts.",
    "part-feat3": "Equipment built for the heavy demands of commercial pools and spas.",
    "cnt-subtitle": "Direct Support",
    "cnt-title": "Need your pool ready before the next check-in?",
    "cnt-desc": "Tell us what property you manage and what support you need. We’ll get back to you with a clear next step.",
    "cnt-btn-phone": "+30 694 207 2531",
    "cnt-btn-email": "info@watercyclesystem.gr",
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
    "ft-copyright": "<strong class=\"font-bold text-primary-500\">Water Cycle System</strong>. All rights reserved.",
    "ft-privacy": "Privacy Policy",
    "ft-terms": "Terms of Service",
    "chat-title": "Water Cycle System Assistant"
  },
  el: {
    "brand-loc": "Σαντορινη",
    "brand-sub": "Κεντρικά Γραφεία",
    "nav-services": "Υπηρεσίες",
    "nav-about": "Η Εταιρεία",
    "nav-standards": "Συνεργασία",
    "nav-contact": "Επικοινωνία",
    "nav-cta": "Επικοινωνία",
    "hero-badge": "Επισημος Συνεργατης Fluidra",
    "hero-h1-1": "Φροντίδα Πισίνας & Spa",
    "hero-h1-2": "για Βίλες & Ξενοδοχεία στη Σαντορίνη",
    "hero-p": "Κατασκευή, συντήρηση, ανάλυση νερού και επαγγελματικά χημικά για πισίνες, jacuzzi, χαμάμ και σάουνες. Τοπική υποστήριξη στη Σαντορίνη, με άμεση ανταπόκριση και αξιόπιστο εξοπλισμό Fluidra / AstralPool.",
    "hero-btn-1": "Επικοινωνήστε",
    "hero-btn-2": "Υπηρεσίες",
    "badge-1": "24/7 Υποστηριξη",
    "badge-2": "Συνεργατης Fluidra",
    "badge-3": "Τεχνικη Εξειδικευση",
    "overlay-1": "Πιστοποιηση AstralPool",
    "overlay-2": "Κορυφαιος Εξοπλισμος",
    "srv-subtitle": "Τοπικες Υπηρεσιες",
    "srv-title": "Ολα όσα χρειάζεται η πισίνα σας, πριν το προσέξει ο επισκέπτης",
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
    "abt-subtitle": "Τοπικη Υποστηριξη",
    "abt-title": "Στη Σαντορίνη, η πισίνα είναι μέρος της εμπειρίας του επισκέπτη.",
    "abt-p1": "Θολό νερό, πρόβλημα στο jacuzzi ή λάθος χημική ισορροπία μπορούν πολύ γρήγορα να γίνουν παράπονο. Η Water Cycle System προσφέρει τοπική, επαγγελματική υποστήριξη για βίλες και ξενοδοχειακές μονάδες που δεν έχουν περιθώριο για προβλήματα μέσα στη σεζόν.",
    "abt-p2": "Συνδυάζουμε τεχνική γνώση, ανάλυση νερού και άμεση ανταπόκριση, ώστε οι εγκαταστάσεις σας να παραμένουν καθαρές, ασφαλείς και έτοιμες κάθε μέρα.",
    "abt-feat1-title": "Τοπικοί Τεχνικοί",
    "abt-feat1-desc": "Με έδρα τη Σαντορίνη για άμεση ανταπόκριση όταν η εγκατάστασή σας το χρειάζεται.",
    "abt-feat2-title": "Αναλυτική Καταγραφή",
    "abt-feat2-desc": "Αναλυτικά αρχεία χημικών ώστε οι διαχειριστές να γνωρίζουν πάντα την κατάσταση.",
    "part-subtitle": "Επισημος Συνεργατης",
    "part-title": "Αξιόπιστος Εξοπλισμός για Επαγγελματικές Εγκαταστάσεις.",
    "part-copy": "Ως επίσημος συνεργάτης της Fluidra S.A. και της AstralPool, παρέχουμε και εγκαθιστούμε επαγγελματικό εξοπλισμό πισίνας και spa, κατασκευασμένο για βαριά εποχιακή χρήση.",
    "part-feat1": "Επίσημη πρόσβαση στην πλήρη γκάμα επαγγελματικού εξοπλισμού της AstralPool.",
    "part-feat2": "Άμεση τεχνική υποστήριξη και γρήγορη πρόσβαση σε γνήσια ανταλλακτικά.",
    "part-feat3": "Εξοπλισμός σχεδιασμένος για τις υψηλές απαιτήσεις των εμπορικών κολυμβητηρίων και spa.",
    "cnt-subtitle": "Αμεση Υποστηριξη",
    "cnt-title": "Θέλετε η πισίνα να είναι έτοιμη πριν το επόμενο check-in;",
    "cnt-desc": "Πείτε μας τι ακίνητο διαχειρίζεστε και τι υποστήριξη χρειάζεστε. Θα επικοινωνήσουμε μαζί σας με ξεκάθαρο επόμενο βήμα.",
    "cnt-btn-phone": "+30 694 207 2531",
    "cnt-btn-email": "info@watercyclesystem.gr",
    "cnt-lbl-name": "Ονοματεπωνυμο *",
    "cnt-lbl-email": "Διευθυνση Email *",
    "cnt-lbl-phone": "Τηλεφωνο Επικοινωνιας",
    "cnt-lbl-service": "Υπηρεσια Ενδιαφεροντος",
    "opt-1": "Σχεδιασμός & Κατασκευή",
    "opt-2": "Εποχιακή & Ετήσια Συντήρηση",
    "opt-3": "Ανάλυση Νερού & Χημικά",
    "opt-4": "Υποστήριξη Εξοπλισμού",
    "opt-5": "Γενική Ερώτηση",
    "cnt-lbl-message": "Μηνυμα *",
    "cnt-submit": "Αποστολη Μηνυματος",
    "ft-copyright": "<strong class=\"font-bold text-primary-500\">Water Cycle System</strong>. Με την επιφύλαξη παντός δικαιώματος.",
    "ft-privacy": "Πολιτική Απορρήτου",
    "ft-terms": "Οροι Υπηρεσιών",
    "chat-title": "Βοηθός Water Cycle System"
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
    submitText.textContent = lang === 'el' ? 'Αποστολη Μηνυματος' : 'Send Message';
  }

  // Update lang toggle aria-label on language change
  const langToggleBtn = document.getElementById('lang-toggle-btn');
  if (langToggleBtn) {
    langToggleBtn.setAttribute('aria-label', lang === 'en' ? 'Switch to Greek' : 'Switch to English');
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

// ─── GDPR: Cookie Consent Banner ────────────────────────────────────────────

(function initCookieConsent() {
  const banner      = document.getElementById('cookie-banner');
  const chatBtn     = document.getElementById('chat-widget-btn');
  const chatPanel   = document.getElementById('chat-widget-container');
  if (!banner) return;

  const COOKIE_KEY  = 'wcs-cookie-consent';
  const GAP         = 16; // px gap between banner top and chat button bottom

  // Push the chat FAB + panel above the banner
  function liftChatUI() {
    if (window.innerWidth < 640) {
      if (chatBtn) chatBtn.style.display = 'none';
      return;
    }

    const h = banner.offsetHeight;
    if (chatBtn)   chatBtn.style.bottom   = (h + GAP) + 'px';
    if (chatPanel) chatPanel.style.bottom = (h + GAP + chatBtn.offsetHeight + 8) + 'px';
  }

  // Reset to Tailwind defaults (bottom-6 = 24px)
  function resetChatUI() {
    if (chatBtn) {
      chatBtn.style.bottom = '';
      chatBtn.style.display = '';
    }
    if (chatPanel) chatPanel.style.bottom = '';
  }

  // Hide banner immediately if consent already given
  if (localStorage.getItem(COOKIE_KEY)) {
    banner.style.display = 'none';
    return;
  }

  // Lift on first paint, and again if window resizes (banner height may change on mobile)
  liftChatUI();
  window.addEventListener('resize', liftChatUI, { passive: true });

  function dismissBanner(consentValue) {
    localStorage.setItem(COOKIE_KEY, consentValue);
    window.removeEventListener('resize', liftChatUI);
    banner.classList.remove('cookie-banner-slide');
    banner.classList.add('cookie-banner-hide');
    banner.addEventListener('animationend', () => {
      banner.style.display = 'none';
      resetChatUI();
    }, { once: true });
  }

  const acceptBtn    = document.getElementById('cookie-accept-btn');
  const necessaryBtn = document.getElementById('cookie-necessary-btn');

  if (acceptBtn)    acceptBtn.addEventListener('click',    () => dismissBanner('all'));
  if (necessaryBtn) necessaryBtn.addEventListener('click', () => dismissBanner('necessary'));

  // "Μάθετε περισσότερα" opens the privacy modal
  const cookieOpenPrivacy = document.getElementById('cookie-open-privacy');
  if (cookieOpenPrivacy) {
    cookieOpenPrivacy.addEventListener('click', () => openPrivacyModal());
  }
})();

// ─── GDPR: Privacy Policy Modal ─────────────────────────────────────────────

function openPrivacyModal() {
  const modal = document.getElementById('privacy-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('modal-open');
  document.body.style.overflow = 'hidden';
  
  // Accessibility: Focus the modal title or first button
  const focusTarget = modal.querySelector('#privacy-modal-title') || modal.querySelector('button');
  if (focusTarget) {
    if (focusTarget.tagName === 'H2') focusTarget.setAttribute('tabindex', '-1');
    focusTarget.focus();
  }
}

function closePrivacyModal() {
  const modal = document.getElementById('privacy-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('modal-open');
  document.body.style.overflow = '';
  
  // Accessibility: Return focus to trigger button
  const trigger = document.getElementById('open-privacy-modal') || document.getElementById('cookie-open-privacy');
  if (trigger) trigger.focus();
}

// Modal Focus Trap Logic
(function initModalFocusTrap() {
  const modal = document.getElementById('privacy-modal');
  if (!modal) return;

  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    
    const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        last.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  });
})();


(function initPrivacyModal() {
  // Open triggers
  const openBtns = document.querySelectorAll('#open-privacy-modal, [data-open-privacy-modal]');
  openBtns.forEach((openBtn) => openBtn.addEventListener('click', openPrivacyModal));

  // Close triggers: X button, footer button, backdrop click, ESC key
  const closeBtn = document.getElementById('close-privacy-modal');
  const closeFooterBtn = document.getElementById('close-privacy-modal-btn');
  const backdrop = document.getElementById('privacy-modal-backdrop');

  if (closeBtn)       closeBtn.addEventListener('click', closePrivacyModal);
  if (closeFooterBtn) closeFooterBtn.addEventListener('click', closePrivacyModal);
  if (backdrop)       backdrop.addEventListener('click', closePrivacyModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePrivacyModal();
  });
})();
