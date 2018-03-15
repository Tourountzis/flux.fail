function findDelay(id, store) {
  const state = store.getState();
  if (!state.delays) {
    return null;
  }
  const matched = state.delays.reported.filter(delay => delay.id === id);
  if (!matched.length) {
    return null;
  }
  return matched[0];
}

const delays = store => next => (action) => {
  switch (action.type) {
    case 'EDIT_DELAY': {
      const delay = findDelay(action.id, store);
      next({
        type: action.type,
        props: delay,
      });
      return;
    }
    case 'SAVE_DELAY': {
      next({
        type: 'SAVING_DELAY',
      });
      const { user } = store.getState();
      if (!user.token) {
        next({
          type: 'SAVE_DELAY_ERROR',
          message: 'Must be logged in',
        });
        return;
      }
      fetch(`${API_URL}/delay`, {
        body: JSON.stringify(action.props),
        headers: {
          authorization: `Bearer ${user.token}`,
          'content-type': 'application/json',
        },
        method: 'POST',
      })
        .then((res) => {
          if (res.status !== 202) {
            throw new Error(res.statusText);
          }
          return res.text();
        })
        .then(() => {
          next(action);
        }, (err) => {
          next({
            type: 'SAVE_DELAY_ERROR',
            message: err.message,
          });
        });
      return;
    }
    case 'USER_LOGIN': {
      next(action);
      // Load existing delays for user
      next({
        type: 'DELAYS_LOADING',
      });
      fetch(`${API_URL}/delay`, {
        headers: {
          authorization: `Bearer ${action.token}`,
        },
      })
        .then((res) => {
          if (res.status !== 200) {
            throw new Error(res.statusText);
          }
          return res.json();
        })
        .then((storedDelays) => {
          next({
            type: 'DELAYS_LOADED',
            delays: storedDelays.map(delay => ({
              ...delay,
              date: new Date(delay.date),
              created_at: new Date(delay.created_at),
              updated_at: new Date(delay.updated_at),
            })),
          });
        }, (err) => {
          next({
            type: 'DELAYS_LOAD_ERROR',
            message: err.message,
          });
        });
      return;
    }
    default: {
      next(action);
    }
  }
};

export default delays;
