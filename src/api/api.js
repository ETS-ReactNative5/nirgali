const { createApolloFetch } = require('apollo-fetch');

const createFetch = URI => {
  const apolloFetch = createApolloFetch({
    uri: URI
  });

  apolloFetch.use(({ request, options }, next) => {
    if (!options.headers) {
      options.headers = {}; // Create the headers object if needed.
    }
    options.headers['ET-Client-Name'] = 'entur - deviation-messages';

    next();
  });

  return apolloFetch;
};

const getAuthorities = URI => () => {
  const apolloFetch = createFetch(URI);
  const query = `
      {
        authorities{
          id
          name
        }
      } `;

  return apolloFetch({ query })
    .catch(error => error)
    .then(response => response);
};

const getLines = URI => authorities => {
  const apolloFetch = createFetch(URI);

  const query = `
      {
        lines(authorities: "${authorities}") {
          name
          id
          publicCode
          quays {
            id
            name
            stopPlace{
              id
            }
          }
        }
      } `;

  return apolloFetch({ query })
    .catch(error => error)
    .then(response => response);
};

const getDepartures = URI => (line, date) => {
  const apolloFetch = createFetch(URI);

  const query = `
      {
        serviceJourneys(lines: "${line}", activeDates: "${date}") {
          id
          estimatedCalls(date:"${date}") {
            aimedDepartureTime
            quay {
              name
              stopPlace {
                id
              }
            }
          }
        }
      }`;

  return apolloFetch({ query })
    .catch(error => error)
    .then(response => response);
};

const getServiceJourney = URI => (id, date) => {
  const apolloFetch = createFetch(URI);

  const query = `
    {
      serviceJourney(id: "${id}") {
        id
        line {id}
        estimatedCalls(date:"${date}") {
          aimedDepartureTime
          quay {
            name
          }
        }
      }
    }`;

  return apolloFetch({ query })
    .catch(error => error)
    .then(response => response);
};

const fetchGet = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    'ET-Client-Name': 'entur - deviation-messages'
  }
};

const organisationID = URI => id => {
  fetch(`${URI}/${id}`, fetchGet)
    .catch(error => error)
    .then(response => response);
};

export default config => ({
  getAuthorities: getAuthorities(config['journey-planner-api']),
  organisationID: organisationID(config['organisations-api']),
  getLines: getLines(config['journey-planner-api']),
  getDepartures: getDepartures(config['journey-planner-api']),
  getServiceJourney: getServiceJourney(config['journey-planner-api'])
});
