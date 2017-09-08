(function () {

  const server = 'https://quiet-spire-82357.herokuapp.com';
  const refBaseHref = `${server}/reference`;
  const cardsBaseHref = `${server}/cards`;
  const ref = {};

  function options(data, type) {
    return {
      data: JSON.stringify(data),
      contentType: 'application/json',
      type
    };
  }

  const listState = {
    pattern: /^$/,
    name: 'list',
    exit: function () {
      document
        .querySelector('#last-name-search-form')
        .removeEventListener('submit', this.performSearch);
      this.performSearch = null;
    },
    enter: function (next, error) {
      document.querySelector('#last-name-search').value = '';
      $.getJSON(cardsBaseHref, data => {
        next(data);
      })
        .fail(e => console.error(e) || error('Could not load list of cards'));
    },
    render: function ({ data }) {
      if (!this.performSearch) {
        this.performSearch = this.handleSearch.bind(this);
        document
          .querySelector('#last-name-search-form')
          .addEventListener('submit', this.performSearch);
      }
      data.sort((a, b) => a.lastName.charCodeAt(0) - b.lastName.charCodeAt(0));
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
    },
    handleSearch: function (e) {
      e.preventDefault();
      const filter = document.querySelector('#last-name-search').value;
      $.getJSON(`${cardsBaseHref}?lastName=${filter}`, data => {
        data.sort((a, b) => a.lastName.charCodeAt(0) - b.lastName.charCodeAt(0));
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
      })
        .fail(e => console.error(e) || error('Could not load list of cards'));
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
        .fail(() => error('Could not load card deatils'));
    },
    render: function ({ data }) {
      $('button[data-href-template]').each(function () {
        let element = $(this);
        element.data('href', element.data('hrefTemplate').replace(/\{id\}/, data.id));
      });
      data.addresses = data.addresses || [];
      data.phoneNumbers = data.phoneNumbers || [];
      data.title = ref.personTitles[data.personTitle];
      for (let key in data) {
        $(`#detail-${key}`).html(data[key]);
      }
      template('address', data.id, data.addresses);
      template('phone', data.id, data.phoneNumbers);
      let imageHolder = document.querySelector('#state-detail .card-image');
      if (data.pictureUrl) {
        imageHolder.style.backgroundImage = `url(${data.pictureUrl})`;
        imageHolder.classList.remove('is-hidden');
      } else {
        imageHolder.classList.add('is-hidden');
      }
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
      $.ajax(cardsBaseHref, options(payload, 'POST'))
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
        .fail(() => error('Could not load card deatils'));
    },
    render: function ({ data }) {
      data.addresses = data.addresses || [];
      data.phoneNumbers = data.phoneNumbers || [];
      data.title = ref.personTitles[data.personTitle];
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
      $.ajax(`${cardsBaseHref}/${id}/addresses`, options(payload, 'POST'))
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
        .fail(() => error('Could not load card deatils'));
    },
    render: function ({ data }) {
      data.addresses = data.addresses || [];
      data.phoneNumbers = data.phoneNumbers || [];
      data.title = ref.personTitles[data.personTitle];
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
      $.ajax(`${cardsBaseHref}/${id}/phones`, options(payload, 'POST'))
        .done(data => location.hash = `#${id}`)
        .fail(e => console.error(e) || error('Could not save new phone number'));
    }
  };

  const editAddressState = {
    pattern: /^#(\d+)\/addresses\/(\d+)$/,
    params: ['id', 'addressId'],
    name: 'edit-address',
    exit: function () {
      $('#edit-address-form').off('submit', this.handleSubmit);
    },
    enter: function (next, error) {
      let id = Number.parseInt(this.id);
      let addressId = Number.parseInt(this.addressId);
      $.getJSON(`${cardsBaseHref}/${id}`, data => {
        next({ contact: data, id, addressId });
      })
        .fail(() => error('Could not load card deatils'));
    },
    render: function ({ data: { contact, id, addressId } }) {
      contact.addresses = contact.addresses || [];
      contact.phoneNumbers = contact.phoneNumbers || [];
      contact.title = ref.personTitles[contact.personTitle];
      const address = contact.addresses.find(x => x.id === addressId);
      for (let key in contact) {
        $(`#edit-address-${key}`).html(contact[key]);
      }
      $('button[data-href-template]').each(function () {
        let element = $(this);
        element.data('href', element.data('hrefTemplate').replace(/\{id\}/, id));
      });
      $('#edit-address-form')
        .on('submit', this.handleSubmit)
        .data('cardId', contact.id)
        .data('addressId', address.id);
      for (let element of $('#edit-address-form')[0].elements) {
        $(element).val(address[element.name]);
      }
    },
    handleSubmit: function (e) {
      e.preventDefault();
      let id = $(this).data('cardId');
      let addressId = $(this).data('addressId');
      let payload = {};
      for (let element of this.elements) {
        if (element.name) {
          payload[element.name] = $(element).val();
        }
      }
      $.ajax(`${cardsBaseHref}/${id}/addresses/${addressId}`, options(payload, 'PUT'))
        .done(data => location.hash = `#${id}`)
        .fail(e => console.error(e) || error('Could not update address'));
    }
  };

  const editPhoneState = {
    pattern: /^#(\d+)\/phones\/(\d+)$/,
    params: ['id', 'phoneId'],
    name: 'edit-phone',
    exit: function () {
      $('#edit-phone-form').off('submit', this.handleSubmit);
    },
    enter: function (next, error) {
      let id = Number.parseInt(this.id);
      let phoneId = Number.parseInt(this.phoneId);
      $.getJSON(`${cardsBaseHref}/${id}`, data => next({ contact: data, id, phoneId }))
        .fail(() => error('Could not load card deatils'));
    },
    render: function ({ data: { contact, id, phoneId } }) {
      contact.addresses = contact.addresses || [];
      contact.phoneNumbers = contact.phoneNumbers || [];
      contact.title = ref.personTitles[contact.personTitle];
      const phone = contact.phoneNumbers.find(x => x.id === phoneId);
      for (let key in contact) {
        $(`#edit-phone-${key}`).html(contact[key]);
      }
      $('button[data-href-template]').each(function () {
        let element = $(this);
        element.data('href', element.data('hrefTemplate').replace(/\{id\}/, id));
      });
      $('#edit-phone-form')
        .on('submit', this.handleSubmit)
        .data('cardId', contact.id)
        .data('phoneId', phone.id);
      for (let element of $('#edit-phone-form')[0].elements) {
        $(element).val(phone[element.name]);
      }
    },
    handleSubmit: function (e) {
      e.preventDefault();
      let id = $(this).data('cardId');
      let phoneId = $(this).data('phoneId');
      let payload = {};
      for (let element of this.elements) {
        if (element.name) {
          payload[element.name] = $(element).val();
        }
      }
      $.ajax(`${cardsBaseHref}/${id}/phones/${phoneId}`, options(payload, 'PUT'))
        .done(data => location.hash = `#${id}`)
        .fail(e => console.error(e) || error('Could not update phone number'));
    }
  };

  const states = [editPhoneState, editAddressState, newPhoneState, newAddressState, newState, detailState, listState];

  function template(id, contextId, data) {
    let list = $(`#${id}-list`);
    list.html('');
    let template = document.querySelector(`#${id}-template`).content;
    for (let datum of data) {
      let clone = document.importNode(template, true);
      let li = clone.querySelector('li');
      let t = li.getAttribute('data-href');
      let href = t.replace(/\{id\}/, contextId).replace(`{${id}Id}`, datum.id);
      li.setAttribute('data-href', href);
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
    values = values.filter(x => x);
    values.sort((a, b) => a.text < b.text ? -1 : a.text === b.text ? 0 : 1);
    for (let value of values) {
      let option = $('<option></option>');
      option.prop('value', value.value);
      option.html(value.text);
      target.append(option);
    }
  }
  function toRef(acc, tuple) {
    if (tuple) {
      acc[tuple.value] = tuple.text;
    }
    return acc;
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
      fillSelect($('#edit-address-types'), addressTypes);
      fillSelect($('#states'), states);
      fillSelect($('#edit-states'), states);
      fillSelect($('#number-types'), numberTypes);
      fillSelect($('#edit-number-types'), numberTypes);
      ref.addressTypes = addressTypes.reduce(toRef, {});
      ref.numberTypes = numberTypes.reduce(toRef, {});
      ref.personTitles = personTitles.reduce(toRef, {});
      ref.states = states.reduce(toRef, {});
    })
    .catch(e => console.error(e) || error('Could not load reference data'));

  $(function () {
    $('main').removeClass('is-hidden');
    $(document).on('submit', 'form.card-list-delete-form', function (e) {
      e.preventDefault();
      let url = `${server}${this.getAttribute('data-action')}`;
      $.ajax(url, { type: this.getAttribute('data-method') })
        .done(data => detailState.render({ data }))
        .fail(e => console.error(e) || error('Could not delete that'));
    });
    $(document).on('click', 'li[data-href]', function (e) {
      location.hash = this.getAttribute('data-href');
    });
  });

}());
