(function() {
  var clickThreshold = 3; // Number of clicks
  var timeThreshold = 500; // Timeframe in milliseconds
  var clickHistory = [];

  document.addEventListener('click', function(event) {
    var now = Date.now();
    var element = event.target;

    // Filter out old clicks
    clickHistory = clickHistory.filter(function(click) {
      return now - click.time < timeThreshold;
    });

    // Add current click
    clickHistory.push({ time: now, target: element });

    // Check if threshold is met on the same element
    var rapidClicks = clickHistory.filter(function(click) {
      return click.target === element;
    });

    if (rapidClicks.length === clickThreshold) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        'event': 'rage_click',
        'click_elemnt': element.tagName,
        'click_id': element.id || 'none',
        'click_claass': element.className || 'none',
        'click_url': window.location.href
      });
      // Clear history after trigger to prevent double-firing
      clickHistory = [];
    }
  }, true);
})();
