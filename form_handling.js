<script>
  /**
   * COMPREHENSIVE FORM TRACKING SCRIPT FOR GTM (SPA SAFE)
   */
  (function() {
    if (window.__gtm_formTrackerActive) return;
    window.__gtm_formTrackerActive = true;

    window.dataLayer = window.dataLayer || [];

    var interactedForms = new WeakSet();
    var interactedFields = new WeakSet(); 
    var recentSubmitIntents = new WeakMap();
    
    // NEW: Tracks form identities as strings to survive framework re-renders
    var interactedFormSignatures = new Set(); 

    var validElementsRegex = /^(INPUT|SELECT|TEXTAREA)$/i;
    var isSubmitAttemptActive = false;
    var submitAttemptTimeout;

    function markSubmitIntent() {
      isSubmitAttemptActive = true;
      clearTimeout(submitAttemptTimeout);
      submitAttemptTimeout = setTimeout(function() {
        isSubmitAttemptActive = false;
      }, 100);
    }

    function getTrueTarget(e) {
      return (e.composedPath && e.composedPath()[0]) || e.target;
    }

    function getFormContext(element) {
      var formNode = (element.tagName === 'FORM') ? element : (element.form || element.closest('[data-is-form="true"]'));
      if (!formNode) return null;
      
      // NEW: Create a unique string signature based on the form's static attributes
      var signature = [
        formNode.id || '',
        formNode.getAttribute('name') || '',
        formNode.getAttribute('action') || '',
        formNode.className || ''
      ].join('|');

      return {
        node: formNode,
        id: formNode.id || undefined,
        name: formNode.getAttribute('name') || undefined,
        action: formNode.getAttribute('action') || 'ajax_or_custom',
        signature: signature
      };
    }

    function triggerSubmitEvent(form, isFaux) {
      var lastSubmitTime = recentSubmitIntents.get(form.node);
      var now = Date.now();

      if (lastSubmitTime && (now - lastSubmitTime < 2000)) return;

      recentSubmitIntents.set(form.node, now);
      
      window.dataLayer.push({
        'event': 'form_submit',
        'form_id': form.id,
        'form_name': form.name,
        'form_action': form.action,
        'is_faux_form': isFaux || false
      });
    }

    function handleFormInteraction(e) {
      var target = getTrueTarget(e);

      if (!validElementsRegex.test(target.tagName)) return;
      if (target.type === 'hidden' || target.type === 'submit' || target.type === 'button') return;

      var form = getFormContext(target);
      if (!form) return;

      // 1. TRACK FORM START (WITH SPA RE-RENDER PROTECTION)
      var isNewNode = !interactedForms.has(form.node);
      var isNewSignature = !interactedFormSignatures.has(form.signature);

      // Only fire if BOTH the DOM node and the signature are completely new
      if (isNewNode && isNewSignature) {
        interactedForms.add(form.node);
        interactedFormSignatures.add(form.signature);
        
        window.dataLayer.push({
          'event': 'form_start',
          'form_id': form.id,
          'form_name': form.name,
          'form_action': form.action
        });
      } 
      // If the node is new but the signature is known, the framework likely 
      // re-rendered the form. Silently add the new node to the WeakSet so we track it.
      else if (isNewNode) {
        interactedForms.add(form.node);
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

    function handleNativeSubmit(e) {
      var target = getTrueTarget(e);
      var form = getFormContext(target);
      if (!form) return;
      triggerSubmitEvent(form, false);
    }

    function handleSubmitClick(e) {
      var target = getTrueTarget(e);

      var submitBtn = target.closest('button:not([type="button"]):not([type="reset"]), input[type="submit"], input[type="image"], [data-is-submit="true"]');
      if (!submitBtn) return;

      markSubmitIntent();

      var fauxForm = submitBtn.closest('[data-is-form="true"]');
      var isFaux = !!fauxForm && !submitBtn.closest('form');
      
      var form = getFormContext(submitBtn);
      if (!form) return;

      triggerSubmitEvent(form, isFaux);
    }

    document.addEventListener('input', handleFormInteraction, true);
    document.addEventListener('change', handleFormInteraction, true);
    document.addEventListener('invalid', handleValidationError, true);
    document.addEventListener('submit', handleNativeSubmit, true);
    document.addEventListener('click', handleSubmitClick, true);

    document.addEventListener('keydown', function(e) {
      if (e.key !== 'Enter') return;

      var target = getTrueTarget(e);
      var ignoredTags = /^(TEXTAREA|A)$/i;
      if (ignoredTags.test(target.tagName) || target.type === 'button') return;

      var form = getFormContext(target);
      if (form) {
        markSubmitIntent();
        triggerSubmitEvent(form, !target.form);
      }
    }, true);
  })();
</script>
