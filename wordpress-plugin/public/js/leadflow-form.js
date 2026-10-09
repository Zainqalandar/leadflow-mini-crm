(() => {
  const navigation = document.querySelector('[data-leadflow-navigation]');
  const menuToggle = navigation?.querySelector('[data-leadflow-menu-toggle]');
  const themeToggle = navigation?.querySelector('[data-leadflow-theme-toggle]');

  menuToggle?.addEventListener('click', () => {
    const isOpen = navigation.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
  });

  navigation?.querySelectorAll('.leadflow-site-nav__links a').forEach((link) => {
    link.addEventListener('click', () => {
      navigation.classList.remove('is-open');
      menuToggle?.setAttribute('aria-expanded', 'false');
    });
  });

  themeToggle?.addEventListener('click', () => {
    const isLight = navigation.classList.toggle('is-light');
    themeToggle.setAttribute('aria-pressed', isLight ? 'true' : 'false');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navigation?.classList.contains('is-open')) {
      navigation.classList.remove('is-open');
      menuToggle?.setAttribute('aria-expanded', 'false');
      menuToggle?.focus();
    }
  });

  const forms = document.querySelectorAll('.leadflow-form');

  const validateField = (field) => {
    const value = field.value.trim();
    let message = '';

    if (!value) {
      message = 'This field is required.';
    } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      message = 'Enter a valid email address.';
    } else if (field.name === 'name' && value.length < 2) {
      message = 'Enter at least 2 characters.';
    } else if (field.name === 'phone' && value.replace(/\D/g, '').length < 7) {
      message = 'Enter at least 7 digits.';
    } else if (field.name === 'message' && value.length < 10) {
      message = 'Tell us a little more about the project.';
    }

    const container = field.closest('.leadflow-field');
    const error = container?.querySelector('.leadflow-field-error');
    container?.classList.toggle('is-invalid', Boolean(message));
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (error) error.textContent = message;
    return !message;
  };

  forms.forEach((form) => {
    const fields = [...form.querySelectorAll('[data-leadflow-required]')];
    const message = form.querySelector('textarea[name="message"]');
    const counter = form.querySelector('.leadflow-character-count');

    const updateCounter = () => {
      if (message && counter) counter.textContent = `${message.value.length} / 2000`;
    };

    fields.forEach((field) => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.getAttribute('aria-invalid') === 'true') validateField(field);
      });
    });

    message?.addEventListener('input', updateCounter);
    updateCounter();

    form.addEventListener('submit', (event) => {
      const valid = fields.map(validateField).every(Boolean);
      if (!valid) {
        event.preventDefault();
        fields.find((field) => field.getAttribute('aria-invalid') === 'true')?.focus();
        return;
      }

      const submit = form.querySelector('button[type="submit"]');
      if (submit) {
        submit.disabled = true;
        submit.querySelector('span')?.replaceChildren('Sending enquiry…');
      }
    });
  });
})();
