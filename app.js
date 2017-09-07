(function () {

  const server = 'https://quiet-spire-82357.herokuapp.com';
  const refBaseHref = `${server}/reference`;
  const cardsBaseHref = `${server}/cards`;

  function postOptions(data) {
    return {
      data: JSON.stringify(data),
      contentType: 'application/json',
      type: 'POST'
    };
  }

  const listState = {
    pattern: /^$/,
    name: 'list',
    enter: function (next, error) {
      $.getJSON(cardsBaseHref, data => {
        next(data);
      })
      .fail(e => console.error(e) || error('Could not load list of cards'));
    },
    render: function ({ data }) {
      let cardList = $('#card-list');
      cardList.html('');
      for (let entry of data) {
        let item = $('<li></li>');
        let anchor = $('<a></a>');
        anchor.attr('href', `#${entry.id}`);
        anchor.html(`${entry.lastName}, ${entry.firstName}`);
        item.append(anchor);
        cardList.append(item);
      }
    }
  };

  const detailState = {
    pattern: /^#(\d+)$/,
    params: ['id'],
    name: 'detail',
    exit: function () {
      document.querySelector('#delete-card-form')
        .removeEventListener('submit', this.handleDelete);
    },
    enter: function (next, error) {
      let id = this.id;
      $.getJSON(`${cardsBaseHref}/${id}`, data => {
        next(data);
      })
      .fail(() => error ('Could not load card deatils'));
    },
    render: function ({ data }) {
      $('button[data-href-template]').each(function () {
        let element = $(this);
        element.data('href', element.data('hrefTemplate').replace(/\{id\}/, data.id));
      });
      data.addresses = data.addresses || [];
      data.phoneNumbers = data.phoneNumbers || [];
      for (let key in data) {
        $(`#detail-${key}`).html(data[key]);
      }
      template('address', data.addresses);
      template('phone', data.phoneNumbers);
      document.querySelector('#delete-card-form')
        .addEventListener('submit', this.handleDelete);
      $('#delete-card-form').prop('action', server + '/' + $('#delete-card-form').data('actionTemplate').replace(/\{id\}/, data.id));
    },
    handleDelete: function (e) {
      e.preventDefault();
      $.ajax(this.action, { method: 'DELETE' })
        .done(data => location.hash = '')
        .fail(e => console.error(e) || error('Could not delete card'));
    }
  };

  const newState = {
    pattern: /^#new$/,
    name: 'new',
    enter: next => next(),
    exit: function () {
      $('#new-card-form').off('submit', this.handleSubmit);
    },
    render: function () {
      $('#new-card-form').on('submit', this.handleSubmit);
      for (let element of $('#new-card-form')[0].elements) {
        $(element).val(null);
      }
    },
    handleSubmit: function (e) {
      e.preventDefault();
      let payload = {};
      for (let element of this.elements) {
        if (element.name) {
          payload[element.name] = $(element).val();
        }
      }
      $.ajax(cardsBaseHref, postOptions(payload))
        .done(data => location.hash = `#${data.id}`)
        .fail(e => console.error(e) || error('Could not save new card'));
    }
  };

  const newAddressState = {
    pattern: /^#(\d+)\/new-address$/,
    params: ['id'],
    name: 'new-address',
    exit: function () {
      $('#new-address-form').off('submit', this.handleSubmit);
    },
    enter: function (next, error) {
      let id = this.id;
      $.getJSON(`${cardsBaseHref}/${id}`, data => {
        next(data);
      })
      .fail(() => error ('Could not load card deatils'));
    },
    render: function ({ data }) {
      data.addresses = data.addresses || [];
      data.phoneNumbers = data.phoneNumbers || [];
      for (let key in data) {
        $(`#new-address-${key}`).html(data[key]);
      }
      $('button[data-href-template]').each(function () {
        let element = $(this);
        element.data('href', element.data('hrefTemplate').replace(/\{id\}/, data.id));
      });
      $('#new-address-form')
        .on('submit', this.handleSubmit)
        .data('cardId', data.id);
      for (let element of $('#new-address-form')[0].elements) {
        $(element).val(null);
      }
    },
    handleSubmit: function (e) {
      e.preventDefault();
      let id = $(this).data('cardId');
      let payload = {};
      for (let element of this.elements) {
        if (element.name) {
          payload[element.name] = $(element).val();
        }
      }
      $.ajax(`${cardsBaseHref}/${id}/addresses`, postOptions(payload))
        .done(data => location.hash = `#${id}`)
        .fail(e => console.error(e) || error('Could not save new address'));
    }
  };

  const newPhoneState = {
    pattern: /^#(\d+)\/new-phone-number$/,
    params: ['id'],
    name: 'new-phone',
    exit: function () {
      $('#new-phone-form').off('submit', this.handleSubmit);
    },
    enter: function (next, error) {
      let id = this.id;
      $.getJSON(`${cardsBaseHref}/${id}`, data => next(data))
        .fail(() => error ('Could not load card deatils'));
    },
    render: function ({ data }) {
      data.addresses = data.addresses || [];
      data.phoneNumbers = data.phoneNumbers || [];
      for (let key in data) {
        $(`#new-phone-${key}`).html(data[key]);
      }
      $('button[data-href-template]').each(function () {
        let element = $(this);
        element.data('href', element.data('hrefTemplate').replace(/\{id\}/, data.id));
      });
      $('#new-phone-form')
        .on('submit', this.handleSubmit)
        .data('cardId', data.id);
      for (let element of $('#new-phone-form')[0].elements) {
        $(element).val(null);
      }
    },
    handleSubmit: function (e) {
      e.preventDefault();
      let id = $(this).data('cardId');
      let payload = {};
      for (let element of this.elements) {
        if (element.name) {
          payload[element.name] = $(element).val();
        }
      }
      $.ajax(`${cardsBaseHref}/${id}/phones`, postOptions(payload))
        .done(data => location.hash = `#${id}`)
        .fail(e => console.error(e) || error('Could not save new phone number'));
    }
  };

  const states = [newPhoneState, newAddressState, newState, detailState, listState];

  function template(id, data) {
    let list = $(`#${id}-list`);
    list.html('');
    let template = document.querySelector(`#${id}-template`).content;
    for (let datum of data) {
      let clone = document.importNode(template, true);
      for (let key in datum) {
        $(`#${id}-${key}`, clone)
          .html(datum[key])
          .removeAttr('id');
      }
      list.append(clone);
    }
  }

  let current = null;
  function error(message) {
    $('.state').addClass('is-hidden');
    $('#error-state').removeClass('is-hidden');
    $('#error-message').html(message);
  }
  function transition(to = '') {
    $('.state').addClass('is-hidden');
    if (current && typeof current.exit === 'function') {
      current.exit();
    }
    for (let state of states) {
      state.params = state.params || [];
      let match = state.pattern.exec(to);
      if (match) {
        let context = {};
        for (let i = 0; i < state.params.length; i += 1) {
          context[state.params[i]] = match[i + 1];
        }
        state.enter.call(context, function (data) {
          try {
            state.render({ data });
            $(`#state-${state.name}`).removeClass('is-hidden');
            current = state;
          } catch (e) {
            error(e.toString());
          }
        }, error);
      }
    }
  }

  addEventListener('hashchange', e => {
    e.preventDefault();
    transition(location.hash);
  });

  $('button[data-href],button[data-href-template]').click(function (e) {
    e.preventDefault();
    location.hash = $(this).data('href');
  });

  $('.state').addClass('is-hidden');
  error('Loading reference data...');

  function fillSelect(target, values) {
    values.sort((a, b) => a.text < b.text ? -1 : a.text === b.text ? 0 : 1);
    for (let value of values) {
      let option = $('<option></option>');
      option.prop('value', value.value);
      option.html(value.text);
      target.append(option);
    }
  }
  let loading = [];
  let loadingState = $('#loading-state')
    .removeClass('is-hidden');
  for (let route of ['address-types', 'number-types', 'person-titles', 'states']) {
    let report = $('<h2></h2>')
      .addClass('is-unfinished')
      .html(route.replace(/-/g, ' '));
    loadingState.append(report);
    loading.push(new Promise((good, bad) => {
      $.getJSON(`${refBaseHref}/${route}`, data => {
        report
          .removeClass('is-unfinished')
          .addClass('is-finished');
        setTimeout(() => good(data), 500);
      })
        .fail(bad);
    }));
  }
  Promise.all(loading)
    .then(([addressTypes, numberTypes, personTitles, states]) => {
      setTimeout(() => {
        loadingState.addClass('is-hidden');
        transition(location.hash);
      }, 500);
      fillSelect($('#person-titles'), personTitles);
      fillSelect($('#address-types'), addressTypes);
      fillSelect($('#states'), states);
      fillSelect($('#number-types'), numberTypes);
    })
    .catch(e => console.error(e) || error('Could not load reference data'));

  $(function () {
    $('main').removeClass('is-hidden');
  });

}());
