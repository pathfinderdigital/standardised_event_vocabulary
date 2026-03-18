<script>
  /**
   * COMPREHENSIVE FORM TRACKING SCRIPT FOR GTM
   * This script detects user interactions with forms and individual fields, pushing 
   * standardized events to the Google Tag Manager dataLayer. 
   * * Key features:
   * 1. 'form_start': Fires once per form when a user first interacts with it.
   * 2. 'form_field_change': Fires once per field when a user types or selects an option.
   * 3. 'form_validation_error': Captures native HTML5 validation errors upon submission attempts.
   * 4. 'form_submit': Captures form submission attempts (both native <form> and custom <div> faux-forms).
   * * It uses WeakSets and WeakMaps to prevent event spam, avoid DOM mutation, and prevent memory 
   * leaks (highly SPA friendly), utilizing the capture phase to catch non-bubbling events.
   */
  (function() {
    /**
     * Initialize the dataLayer array if it doesn't already exist.
     * This ensures we can safely push events to GTM without throwing undefined errors,
     * even if this script executes before the main GTM container loads.
     */
    window.dataLayer = window.dataLayer || [];

    // Tracks form DOM nodes to prevent duplicate 'form_start' events per form instance
    var interactedForms = new WeakSet();
    
    // Tracks field DOM nodes to prevent duplicate 'form_field_change' events per field instance
    var interactedFields = new WeakSet(); 
    
    // Uses a WeakMap to track submit timestamps by DOM node. 
    // This debounces submissions securely without modifying the DOM (React/Vue safe) or causing memory leaks.
    var recentSubmitIntents = new WeakMap();

    // Regex for valid form elements (Optimized memory allocation instead of redefining arrays)
    /** @type {RegExp} */
    var validElementsRegex = /^(INPUT|SELECT|TEXTAREA)$/i;

    // Tracks if a submit action was recently attempted to contextualize validation errors
    /** @type {boolean} */
    var isSubmitAttemptActive = false;
    /** @type {number|undefined} */
    var submitAttemptTimeout;

    /**
     * Marks a short window (100ms) where any triggered validation errors 
     * are attributed to a form submission attempt.
     * @returns {void}
     */
    function markSubmitIntent() {
      isSubmitAttemptActive = true;
      clearTimeout(submitAttemptTimeout);
      submitAttemptTimeout = setTimeout(function() {
        isSubmitAttemptActive = false;
      }, 100);
    }

    /**
     * Helper function to pierce Shadow DOMs (Web Components) to get the true event target.
     * @param {Event} e - The DOM event object.
     * @returns {HTMLElement} The true origin element of the event.
     */
    function getTrueTarget(e) {
      return (e.composedPath && e.composedPath()[0]) || e.target;
    }

    /**
     * @typedef {Object} FormContext
     * @property {HTMLElement} node - The DOM element representing the form.
     * @property {string|undefined} id - The ID attribute of the form.
     * @property {string|undefined} name - The name attribute of the form.
     * @property {string} action - The action attribute of the form, or a fallback.
     */

    /**
     * Helper function to determine which form an input belongs to.
     * It uses the native, high-performance .form property before falling back to DOM traversal.
     * It extracts and standardizes key form attributes into a reusable object.
     * @param {HTMLElement} element - The DOM element interacting with the form.
     * @returns {FormContext|null} Standardized form details, or null if no form wrapper is found.
     */
    function getFormContext(element) {
      // Optimized: Use native .form property for standard inputs, fallback to closest() for faux-forms
      var formNode = (element.tagName === 'FORM') ? element : (element.form || element.closest('[data-is-form="true"]'));
      if (!formNode) return null;
      return {
        node: formNode,
        id: formNode.id || undefined,
        name: formNode.getAttribute('name') || undefined,
        action: formNode.getAttribute('action') || 'ajax_or_custom'
      };
    }

    /**
     * Consolidated function to fire 'form_submit' events.
     * Debounces events using a WeakMap and timestamp check to prevent double-firing.
     * @param {FormContext} form - The contextual form data object.
     * @param {boolean} [isFaux=false] - Whether this is a non-standard <div> based form.
     * @returns {void}
     */
    function triggerSubmitEvent(form, isFaux) {
      var lastSubmitTime = recentSubmitIntents.get(form.node);
      var now = Date.now();

      // If submitted within the last 2 seconds (2000ms), ignore the duplicate attempt
      if (lastSubmitTime && (now - lastSubmitTime < 2000)) return;

      // Update the WeakMap with the new timestamp
      recentSubmitIntents.set(form.node, now);
      
      window.dataLayer.push({
        'event': 'form_submit',
        'form_id': form.id,
        'form_name': form.name,
        'form_action': form.action,
        'is_faux_form': isFaux || false
      });
    }

    /**
     * Handles user typing ('input') and selections ('change') on form fields.
     * @param {Event} e - The DOM event object.
     * @returns {void}
     */
    function handleFormInteraction(e) {
      var target = getTrueTarget(e);

      // Optimized regex test prevents allocating new arrays into memory on every keystroke
      if (!validElementsRegex.test(target.tagName)) return;
      
      // Ignore hidden fields, submits, and buttons as they don't represent standard text/select input
      if (target.type === 'hidden' || target.type === 'submit' || target.type === 'button') return;

      var form = getFormContext(target);
      if (!form) return;

      // 1. TRACK FORM START
      if (!interactedForms.has(form.node)) {
        interactedForms.add(form.node);
        window.dataLayer.push({
          'event': 'form_start',
          'form_id': form.id,
          'form_name': form.name,
          'form_action': form.action
        });
      }

      // 2. TRACK INDIVIDUAL FIELD CHANGE
      if (!interactedFields.has(target)) {
        interactedFields.add(target);
        window.dataLayer.push({
          'event': 'form_field_change',
          'form_id': form.id,
          'form_name': form.name,
          'field_id': target.id || undefined,
          'field_name': target.getAttribute('name') || undefined,
          'field_type': target.type || target.tagName.toLowerCase()
        });
      }
    }

    /**
     * Tracks standard HTML5 constraint validation errors.
     * IMPORTANT NOTE: This error tracking block exclusively relies on the 
     * standard HTML5 Constraint Validation API (e.g., required, minlength). 
     * @param {Event} e - The DOM event object.
     * @returns {void}
     */
    function handleValidationError(e) {
      var target = getTrueTarget(e);

      if (!validElementsRegex.test(target.tagName)) return;
      
      var form = getFormContext(target);
      if (!form) return;

      var errorMessage = target.validationMessage || "invalid_input";
      var errorTrigger = isSubmitAttemptActive ? 'form_submit' : 'field_interaction';

      window.dataLayer.push({
        'event': 'form_validation_error',
        'form_id': form.id,
        'form_name': form.name,
        'field_id': target.id || undefined,
        'field_name': target.getAttribute('name') || undefined,
        'field_type': target.type || target.tagName.toLowerCase(),
        'error_message': errorMessage,
        'error_trigger': errorTrigger
      });
    }

    /**
     * Captures standard form submission attempts.
     * @param {Event} e - The DOM event object.
     * @returns {void}
     */
    function handleNativeSubmit(e) {
      var target = getTrueTarget(e);
      var form = getFormContext(target);
      if (!form) return;
      triggerSubmitEvent(form, false);
    }

    /**
     * Captures submission attempts for forms via button clicks (covers pre-validation intent 
     * for standard forms and clicks for <div> based faux-forms).
     * @param {Event} e - The DOM event object.
     * @returns {void}
     */
    function handleSubmitClick(e) {
      var target = getTrueTarget(e);

      // Expanded selector to catch implicit submit buttons (<button> without explicit type) and image inputs
      var submitBtn = target.closest('button:not([type="button"]):not([type="reset"]), input[type="submit"], input[type="image"], [data-is-submit="true"]');
      if (!submitBtn) return;

      markSubmitIntent();

      var fauxForm = submitBtn.closest('[data-is-form="true"]');
      var isFaux = !!fauxForm && !submitBtn.closest('form');
      
      var form = getFormContext(submitBtn);
      if (!form) return;

      triggerSubmitEvent(form, isFaux);
    }

    // --- ATTACH EVENT LISTENERS ---
    
    document.addEventListener('input', handleFormInteraction, true);
    document.addEventListener('change', handleFormInteraction, true);
    document.addEventListener('invalid', handleValidationError, true);
    document.addEventListener('submit', handleNativeSubmit, true);
    document.addEventListener('click', handleSubmitClick, true);

    // Listener for 'Enter' key presses which natively trigger form submissions
    document.addEventListener('keydown', function(e) {
      // Immediate short-circuit to prevent performance tax on every keystroke
      if (e.key !== 'Enter') return;

      var target = getTrueTarget(e);
      
      // Exclude TEXTAREA, Links, and generic UI buttons so pressing 'Enter' doesn't log a false submit attempt
      var ignoredTags = /^(TEXTAREA|A)$/i;
      if (ignoredTags.test(target.tagName) || target.type === 'button') return;

      var form = getFormContext(target);
      if (form) {
        markSubmitIntent();
        // Ensure we catch the submit event even if the browser cancels the native submit due to validation
        triggerSubmitEvent(form, !target.form);
      }
    }, true);
  })();
</script>
