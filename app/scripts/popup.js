'use strict';

var currentTab;
var query = {active: true, currentWindow: true};

chrome.tabs.query(query, function(tabs) {
  currentTab = tabs[0];
  var domain = kconnect.getDomainFromUrl(currentTab.url);
  $('h1').text(chrome.i18n.getMessage('appName'));
  $('#khresmoi').text(chrome.i18n.getMessage('khresmoiTitle'));
  $('#q').attr('placeholder',
    chrome.i18n.getMessage('khresmoiPlaceholder'));
  $('#searchSubmit').val(chrome.i18n.getMessage('khresmoiSearch'));
  $('#searchLanguage').val(kconnect.config.khresmoiLanguage);
  $('#host').text(domain);
  $('#readability').text(
    chrome.i18n.getMessage('readabilityTitle').toLowerCase()
  );

  $('#about').text(chrome.i18n.getMessage('about'));
  $('#about').attr('href', chrome.extension.getURL('about.html'));
  $('#trustability-content').text(chrome.i18n.getMessage('comingSoon'));
  $('#readability-content').text(chrome.i18n.getMessage('loading'));
  $('.readability-circle')
      .find('span')
      .append($('<i>', {
        class: 'fa fa-book',
        'aria-hidden': 'true',
      }));

  $('.auto').append(
    $('<i>', {
      class: 'fa fa-warning',
      'aria-hidden': 'true',
    })
  ).append(
    ' ' + chrome.i18n.getMessage('automatedResults')
  );
  $('#trustability').text(
    chrome.i18n.getMessage('trustabilityTitle').toLowerCase()
  );
  $('.trustability-circle')
    .find('span')
    .append($('<i>', {
      class: 'fa fa-stethoscope',
      'aria-hidden': 'true',
    }));

  new ProgressBar.Circle('.trustability-circle', {
    strokeWidth: 7,
    trailWidth: 7,
    trailColor: '#ddd',
  });

  var rProgress = new ProgressBar.Circle('.readability-circle', {
    strokeWidth: 7,
    trailWidth: 7,
    trailColor: '#ddd',
  });

  var readabilityRequest = kconnect.getReadability(currentTab.url);

  $.when(readabilityRequest)
    .then(function(readabilityResponse) {
      var difficulty = readabilityResponse.readability.difficulty;
      var readabilityColor = 'red';
      if (difficulty === 'average') {
        readabilityColor = 'orange';
      } else if (difficulty === 'easy') {
        readabilityColor = 'green';
      }
      rProgress.destroy();
      rProgress = new ProgressBar.Circle('.readability-circle', {
        strokeWidth: 7,
        trailWidth: 7,
        trailColor: '#ddd',
        color: readabilityColor,
        easing: 'easeInOut',
        duration: 800,
      });
      $('.readability-circle')
        .find('span')
        .html($('<i>', {
          class: 'fa fa-book',
          'aria-hidden': 'true',
        }));
      rProgress.animate(1);
      $('#readability-content').html(
        $('<span>').text(
          kconnect.config.difficultyKeyword[difficulty]
        )
      );
    }, function() {
      $('#readability-content').html(
        $('<p>').text(
          chrome.i18n.getMessage('popupReadabilityNoInformation')
        )
      );
      $('.readability-circle')
        .find('span')
        .html($('<i>', {
          class: 'fa fa-ban',
          'aria-hidden': 'true',
        }));
    });
});
