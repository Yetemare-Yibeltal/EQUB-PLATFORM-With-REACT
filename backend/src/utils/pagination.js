const toPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const parsePagination = (
  query = {},
  { defaultLimit = 10, maxLimit = 100 } = {},
) => {
  const page = toPositiveInteger(query.page, 1);
  const limit = Math.min(
    toPositiveInteger(query.limit, defaultLimit),
    maxLimit,
  );

  return { page, limit, skip: (page - 1) * limit };
};

export const buildPaginationMeta = ({ total, page, limit }) => {
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

export const parseSort = (
  sort,
  allowedFields = [],
  fallback = "-createdAt",
) => {
  const requested = typeof sort === "string" && sort.trim() ? sort : fallback;
  const result = {};

  requested
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean)
    .forEach((field) => {
      const direction = field.startsWith("-") ? -1 : 1;
      const name = field.replace(/^[-+]/, "");
      if (allowedFields.includes(name)) {
        result[name] = direction;
      }
    });

  if (Object.keys(result).length === 0) {
    const fallbackName = fallback.replace(/^[-+]/, "");
    result[fallbackName] = fallback.startsWith("-") ? -1 : 1;
  }

  return result;
};

export const paginate = async (model, filter = {}, options = {}) => {
  const {
    page,
    limit,
    skip,
    sort = { createdAt: -1 },
    select,
    populate,
    session,
  } = options;

  let query = model.find(filter).sort(sort).skip(skip).limit(limit);

  if (select) query = query.select(select);
  if (populate) query = query.populate(populate);
  if (session) query = query.session(session);

  const [items, total] = await Promise.all([
    query.exec(),
    model.countDocuments(filter).session(session || null),
  ]);

  return { items, meta: buildPaginationMeta({ total, page, limit }) };
};
