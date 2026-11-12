function parsePagination(query, { defaultLimit = 25, maxLimit = 200 } = {}) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = defaultLimit;
  limit = Math.min(limit, maxLimit);
  return { page, limit, skip: (page - 1) * limit };
}

function paginated(data, { page, limit, total }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

module.exports = { parsePagination, paginated };
