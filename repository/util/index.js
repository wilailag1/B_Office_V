const _ = require('lodash');


exports.toDbObject = (obj, pickFields, omitFields) => {
  if (!obj) {
    return obj;
  }

  const objectFields = Object.keys(obj);
  const snakeCased = objectFields.map(field => _.snakeCase(field));
  let newObj = {};

  objectFields.forEach((field, index) => {
    newObj[snakeCased[index]] = obj[field];
  });

  if (!!pickFields) {
    newObj = _.pick(newObj, pickFields);
  }

  if (!!omitFields) {
    newObj = _.omit(newObj, omitFields);
  }

  return newObj;
};

exports.fromDbObject = obj => {
  if (!obj) {
    return obj;
  }

  const objectFields = Object.keys(obj);
  const camelCased = objectFields.map(field => _.camelCase(field));
  const newObj = {};

  objectFields.forEach((field, index) => {
    newObj[camelCased[index]] = obj[field];
  });

  return newObj;
};
