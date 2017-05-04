$('.slow-scroll').on('click', function(e) {
  e.preventDefault();
  $("body, html").animate({
    scrollTop: $($(this).attr('href')).offset().top
  }, 1200);
});

$('#sendMessage').on('click', function(e) {
  e.preventDefault();

  var finished = true;

  $('#contact-form input').map(function(i) {
    console.log(i, isValidEmailAddress($('#contact-form input')[i].value));
    if ($('#contact-form input')[i].value == '') {
      $($('#contact-form input')[i]).css('border-bottom', '2px solid rgba(255, 65, 54, .6)');
      finished = false;
    } else if (i == 1 && !isValidEmailAddress($('#contact-form input')[i].value)) {
      $($('#contact-form input')[i]).css('border-bottom', '2px solid rgba(255, 65, 54, .6)');
      finished = false;
    } else {
      $($('#contact-form input')[i]).css('border-bottom', '2px solid rgba(94, 136, 17, .95)');
    }
  })

  if ($('#contact-form textarea').val() == '') {
    $('#contact-form textarea').css('border', '2px solid rgba(255, 65, 54, .6)');
    finished = false;
  } else {
    $('#contact-form textarea').css('border', '2px solid rgba(94, 136, 17, .95)');
  }

  if (!finished) {
    return;
  }

  $('#contact-form').addClass('animated fadeOut');
  setTimeout(function() {
    $('#contact-form').html('<h2 id="messageSent">Message Sent!</h2>');
    $('#contact-form').removeClass('animated fadeOut');
    $('#contact-form').addClass('animated fadeIn');
    $('#contact-form').css('text-align', 'center');
  }, 1000);
});

function isValidEmailAddress(emailAddress) {
  var pattern = /^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
  return pattern.test(emailAddress);
};
