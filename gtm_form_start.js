<script>
  (function() {
    window.dataLayer = window.dataLayer || [];

    // 1. Use WeakSet instead of Set. 
    // WeakSet allows the browser's garbage collector to remove the form 
    // from memory if it is removed from the DOM (crucial for SPAs).
    var interactedForms = new WeakSet();

    function handleFormInteraction(e) {
      // 2. Ensure the interaction happened on an actual form field
      var validElements = ['INPUT', 'SELECT', 'TEXTAREA'];
      if (validElements.indexOf(e.target.tagName) === -1) return;

      // Ignore hidden fields or submit buttons
      if (e.target.type === 'hidden' || e.target.type === 'submit' || e.target.type === 'button') return;

      // 3. Find the closest <form> OR a custom wrapper for non-standard forms.
      // If your site uses <div> based forms, just add the attribute data-is-form="true" to the wrapper div.
      var formNode = e.target.closest('form, [data-is-form="true"]');

      if (formNode && !interactedForms.has(formNode)) {
        interactedForms.add(formNode);

        // Sanitize outputs so we don't send 'null' to the dataLayer
        window.dataLayer.push({
          'event': 'form_start',
          'form_id': formNode.id || undefined,
          'form_name': formNode.getAttribute('name') || undefined,
          'form_classes': formNode.className || undefined,
          // Faux-forms won't have an action, so we use a fallback
          'form_action': formNode.getAttribute('action') || 'ajax_or_custom'
        });
      }
    }

    // 4. Use both 'input' and 'change' to cover all browser quirks and input types (like file uploads)
    // 5. The 'true' argument turns on "Event Capture", bypassing any e.stopPropagation() blocks.
    document.addEventListener('input', handleFormInteraction, true);
    document.addEventListener('change', handleFormInteraction, true);
  })();
</script>
