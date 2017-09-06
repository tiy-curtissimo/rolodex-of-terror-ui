(function () {

  const baseHref = 'http://quiet-spire-82357.herokuapp.com/cards';
  const mock = $('#mock').prop('checked');
  const cards = [{
    firstName: 'Mary',
    lastName: 'Contrary',
    title: 'The Honorable',
    id: 0,
    addresses: [{
      type: 'Home',
      street: '123 Main St.',
      city: 'Springfield',
      state: 'AE',
      zip: '00198'
    }],
    phoneNumbers: [
      { type: 'Home', number: '555-1212' },
      { type: 'Mobile', number: '123-456-7890'}
    ]
  }, {
    firstName: 'Marvin', lastName: 'Gardens', title: 'Mr.', id: 1
  }];

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
      $.getJSON(baseHref, data => {
        next(data);
      })
      .fail(() => mock ? next(cards) : error('Could not load list of cards'));
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
    enter: function (next, error) {
      let id = this.id;
      $.getJSON(`${baseHref}/${id}`, data => {
        next(data);
      })
      .fail(() => mock ? next(cards[id]) : error ('Could not load card deatils'));
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
      $.ajax(baseHref, postOptions(payload), data => {
        location.href = `#${data.id}`;
      })
      .fail(() => mock ? ((payload.id = cards.length) && cards.push(payload) && (location.href = `#${payload.id}`)) : error('Could not save new card'));
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
      $.getJSON(`${baseHref}/${id}`, data => {
        next(data);
      })
      .fail(() => mock ? next(cards[id]) : error ('Could not load card deatils'));
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
      console.log('making new address');
      e.preventDefault();
      let id = $(this).data('cardId');
      let payload = {};
      for (let element of this.elements) {
        if (element.name) {
          payload[element.name] = $(element).val();
        }
      }
      $.ajax(baseHref, postOptions(payload), data => {
        location.href = `#${id}`;
      })
      .fail(() => mock ? ((payload.id = cards[id].addresses.length) && cards[id].addresses.push(payload) &&( location.href = `#${id}`)) : error('Could not save new address'));
    }
  };

  const states = [newAddressState, newState, detailState, listState];

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
  transition(location.hash);

  $(function () {
    $('main').removeClass('is-hidden');
  });

}());
